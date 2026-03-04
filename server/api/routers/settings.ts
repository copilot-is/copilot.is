import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { generateUUID } from '@/lib/utils';
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure
} from '@/server/api/trpc';
import { settings } from '@/server/db/schema';

export const settingsRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.settings.findMany();
  }),

  get: publicProcedure
    .input(z.object({ key: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.settings.findFirst({
        where: eq(settings.key, input.key)
      });
    }),

  getDefaults: publicProcedure.query(async ({ ctx }) => {
    const allSettings = await ctx.db.query.settings.findMany();
    const result: Record<string, string | null> = {};
    for (const setting of allSettings) {
      result[setting.key] = setting.value;
    }
    return result;
  }),

  /**
   * Get complete system settings for client initialization
   * Includes all enabled models and default settings
   */
  getSystem: publicProcedure.query(async ({ ctx: _ctx }) => {
    const { getSystemSettings } = await import('@/lib/queries');
    return getSystemSettings();
  }),

  update: adminProcedure
    .input(
      z.object({
        key: z.string().min(1).max(100),
        value: z.string().nullable(),
        description: z.string().max(500).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.settings.findFirst({
        where: eq(settings.key, input.key)
      });

      if (existing) {
        await ctx.db
          .update(settings)
          .set({
            value: input.value,
            description: input.description ?? existing.description,
            updatedAt: new Date()
          })
          .where(eq(settings.key, input.key));
      } else {
        await ctx.db.insert(settings).values({
          id: generateUUID(),
          key: input.key,
          value: input.value,
          description: input.description
        });
      }
    }),

  bulkUpdate: adminProcedure
    .input(
      z.array(
        z.object({
          key: z.string().min(1).max(100),
          value: z.string().nullable(),
          description: z.string().max(500).optional()
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      for (const item of input) {
        const existing = await ctx.db.query.settings.findFirst({
          where: eq(settings.key, item.key)
        });

        if (existing) {
          await ctx.db
            .update(settings)
            .set({
              value: item.value,
              description: item.description ?? existing.description,
              updatedAt: new Date()
            })
            .where(eq(settings.key, item.key));
        } else {
          await ctx.db.insert(settings).values({
            id: generateUUID(),
            key: item.key,
            value: item.value,
            description: item.description
          });
        }
      }
    }),

  delete: adminProcedure
    .input(z.object({ key: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(settings).where(eq(settings.key, input.key));
    })
});
