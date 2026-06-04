import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDefaultQuotaId } from '@/lib/queries';
import { getUserQuota, validateQuotaLimits } from '@/lib/quota';
import { generateUUID } from '@/lib/utils';
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure
} from '@/server/api/trpc';
import { quotas, users } from '@/server/db/schema';

const limitSchema = z.union([z.number().positive(), z.literal('')]).nullable();
const limitToString = (v: number | null | ''): string | null => {
  if (v === '' || v === null) return null;
  return v.toString();
};

export const quotaRouter = createTRPCRouter({
  // ===========================================================================
  // Quota CRUD (independent entity)
  // ===========================================================================

  /**
   * List all quotas (admin). Marks the system default.
   */
  list: adminProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.query.quotas.findMany({
      orderBy: (q, { asc }) => [asc(q.name)]
    });
    const defaultQuotaId = await getDefaultQuotaId();
    return all.map(q => ({
      ...q,
      isDefault: q.id === defaultQuotaId
    }));
  }),

  /**
   * Listing used by selectors (public-ish, but kept admin for now).
   */
  listForSelect: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.quotas.findMany({
      orderBy: (q, { asc }) => [asc(q.name)],
      columns: { id: true, name: true, isUnlimited: true }
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional().nullable(),
        fiveHour: limitSchema.default(null),
        sevenDay: limitSchema.default(null),
        isUnlimited: z.boolean().default(false),
        allowedModelIds: z.array(z.string()).default([])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const num = (v: number | null | ''): number | null =>
        v === '' || v === null ? null : v;
      if (!input.isUnlimited) {
        const w = num(input.sevenDay);
        if (w === null || w <= 0) {
          throw new Error(
            'Weekly limit is required and must be positive (or toggle Unlimited).'
          );
        }
        validateQuotaLimits({
          fiveHour: num(input.fiveHour),
          sevenDay: w
        });
      }
      const id = generateUUID();
      await ctx.db.insert(quotas).values({
        id,
        name: input.name,
        description: input.description ?? null,
        fiveHour: input.isUnlimited ? null : limitToString(input.fiveHour),
        sevenDay: input.isUnlimited ? null : limitToString(input.sevenDay),
        isUnlimited: input.isUnlimited,
        allowedModelIds: input.allowedModelIds
      });
      return { id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional().nullable(),
        fiveHour: limitSchema.optional(),
        sevenDay: limitSchema.optional(),
        isUnlimited: z.boolean().optional(),
        allowedModelIds: z.array(z.string()).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.name !== undefined) patch.name = updates.name;
      if (updates.description !== undefined)
        patch.description = updates.description ?? null;
      if (updates.fiveHour !== undefined)
        patch.fiveHour = limitToString(updates.fiveHour);
      if (updates.sevenDay !== undefined)
        patch.sevenDay = limitToString(updates.sevenDay);
      if (updates.isUnlimited !== undefined)
        patch.isUnlimited = updates.isUnlimited;
      if (updates.allowedModelIds !== undefined)
        patch.allowedModelIds = updates.allowedModelIds;

      // Validate the resulting limits state (existing values merged with patch).
      const existing = await ctx.db.query.quotas.findFirst({
        where: eq(quotas.id, id)
      });
      if (!existing) throw new Error('Quota not found');
      const num = (
        v: number | null | '' | undefined,
        fallback: string | null
      ): number | null => {
        if (v === undefined) {
          if (fallback === null || fallback === '') return null;
          const n = Number(fallback);
          return Number.isFinite(n) ? n : null;
        }
        if (v === '' || v === null) return null;
        return v;
      };
      const willBeUnlimited =
        updates.isUnlimited !== undefined
          ? updates.isUnlimited
          : existing.isUnlimited;
      if (!willBeUnlimited) {
        const w = num(updates.sevenDay, existing.sevenDay);
        if (w === null || w <= 0) {
          throw new Error(
            'Weekly limit is required and must be positive (or toggle Unlimited).'
          );
        }
        validateQuotaLimits({
          fiveHour: num(updates.fiveHour, existing.fiveHour),
          sevenDay: w
        });
      } else {
        // Force null the limits whenever Unlimited is on, so stale values
        // don't linger from a previous non-unlimited state.
        patch.fiveHour = null;
        patch.sevenDay = null;
      }

      await ctx.db.update(quotas).set(patch).where(eq(quotas.id, id));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // FK ON DELETE restrict will block deletion if any plan references it.
      // Also block deleting the system default quota.
      const defaultId = await getDefaultQuotaId();
      if (defaultId === input.id) {
        throw new Error(
          'Cannot delete the default quota. Set a different default first.'
        );
      }
      await ctx.db.delete(quotas).where(eq(quotas.id, input.id));
    }),

  // ===========================================================================
  // Per-user view & overrides
  // ===========================================================================

  /** Current user's quota — same shape as `getByUser`, no dollar amounts. */
  me: protectedProcedure.query(async ({ ctx }) => {
    return await getUserQuota(ctx.session.user.id);
  }),

  /** Admin: any user's quota (same shape as `me`). */
  getByUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      return await getUserQuota(input.userId);
    }),

  /**
   * Admin: assign a quota override to a user.
   */
  setUserQuota: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        quotaId: z.string().min(1)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.query.quotas.findFirst({
        where: eq(quotas.id, input.quotaId)
      });
      if (!exists) throw new Error('Quota not found');
      await ctx.db
        .update(users)
        .set({ quotaId: input.quotaId, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
    }),

  /**
   * Admin: clear a user's override; user falls back to their plan or default.
   */
  removeUserQuota: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ quotaId: null, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
    })
});
