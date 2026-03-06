import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { generateUUID } from '@/lib/utils';
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure
} from '@/server/api/trpc';
import { prompts } from '@/server/db/schema';

const promptTypeSchema = z.enum(['system', 'user']);
const capabilitySchema = z
  .enum(['chat', 'image', 'video', 'audio'])
  .nullable()
  .optional();
const providersSchema = z.array(z.string()).nullable().optional();

export const promptRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          type: promptTypeSchema.optional()
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.prompts.findMany({
        where: input?.type ? eq(prompts.type, input.type) : undefined,
        orderBy: (prompts, { asc, desc }) => [
          asc(prompts.displayOrder),
          desc(prompts.createdAt)
        ]
      });
    }),

  getSystemPrompts: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.prompts.findMany({
      where: eq(prompts.type, 'system'),
      orderBy: (prompts, { asc, desc }) => [
        asc(prompts.displayOrder),
        desc(prompts.createdAt)
      ]
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.prompts.findFirst({
        where: eq(prompts.id, input.id)
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: promptTypeSchema,
        capability: capabilitySchema,
        providers: providersSchema,
        image: z.string().max(500).nullable().optional(),
        content: z.string().min(1),
        displayOrder: z.number().int().default(0)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = generateUUID();
      await ctx.db.insert(prompts).values({
        id,
        name: input.name,
        type: input.type,
        capability: input.capability,
        providers: input.providers,
        image: input.image,
        content: input.content,
        displayOrder: input.displayOrder
      });
      return { id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        type: promptTypeSchema.optional(),
        capability: capabilitySchema,
        providers: providersSchema,
        image: z.string().max(500).nullable().optional(),
        content: z.string().min(1).optional(),
        displayOrder: z.number().int().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      await ctx.db
        .update(prompts)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(prompts.id, id));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(prompts).where(eq(prompts.id, input.id));
    })
});
