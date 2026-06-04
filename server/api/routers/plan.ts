import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { generateUUID } from '@/lib/utils';
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure
} from '@/server/api/trpc';
import { plans, quotas, users } from '@/server/db/schema';

export const planRouter = createTRPCRouter({
  /**
   * Public list (used by clients to display tier info in /settings/usage).
   */
  /**
   * Public list of plans — id / name / description / displayOrder only.
   * Deliberately omits the linked quota row to avoid leaking quota dollar
   * amounts to the user end.
   */
  listPublic: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.plans.findMany({
      columns: {
        id: true,
        name: true,
        description: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: (p, { asc }) => [asc(p.displayOrder), asc(p.name)]
    });
  }),

  /**
   * Admin list — also returns user count per plan.
   */
  list: adminProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.query.plans.findMany({
      orderBy: (p, { asc }) => [asc(p.displayOrder), asc(p.name)],
      with: { quota: true }
    });

    const counts = await ctx.db
      .select({
        planId: users.planId,
        count: sql<number>`count(*)`
      })
      .from(users)
      .groupBy(users.planId);

    const countMap = new Map(counts.map(c => [c.planId, Number(c.count)]));
    return all.map(p => ({
      ...p,
      userCount: countMap.get(p.id) ?? 0
    }));
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional().nullable(),
        quotaId: z.string().min(1),
        displayOrder: z.number().int().default(0)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = generateUUID();
      // Verify quota exists
      const quota = await ctx.db.query.quotas.findFirst({
        where: eq(quotas.id, input.quotaId)
      });
      if (!quota) throw new Error('Quota not found');

      await ctx.db.insert(plans).values({
        id,
        name: input.name,
        description: input.description ?? null,
        quotaId: input.quotaId,
        displayOrder: input.displayOrder
      });

      return { id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional().nullable(),
        quotaId: z.string().min(1).optional(),
        displayOrder: z.number().int().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.name !== undefined) patch.name = updates.name;
      if (updates.description !== undefined)
        patch.description = updates.description ?? null;
      if (updates.quotaId !== undefined) {
        const quota = await ctx.db.query.quotas.findFirst({
          where: eq(quotas.id, updates.quotaId)
        });
        if (!quota) throw new Error('Quota not found');
        patch.quotaId = updates.quotaId;
      }
      if (updates.displayOrder !== undefined)
        patch.displayOrder = updates.displayOrder;

      await ctx.db.update(plans).set(patch).where(eq(plans.id, id));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(plans).where(eq(plans.id, input.id));
    })
});
