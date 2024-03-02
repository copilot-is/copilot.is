import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { chats } from '@/server/db/schema'

export const chatRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().trim().min(1).max(255),
        messages: z
          .array(
            z.object({
              id: z.string(),
              role: z.enum([
                'system',
                'user',
                'assistant',
                'function',
                'data',
                'tool'
              ]),
              content: z.string()
            })
          )
          .nonempty(),
        usage: z.object({
          model: z.string(),
          temperature: z.number().optional(),
          frequencyPenalty: z.number().optional(),
          presencePenalty: z.number().optional(),
          topP: z.number().optional(),
          topK: z.number().optional()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(chats)
        .values({
          id: input.id,
          title: input.title,
          userId: ctx.session.user.id,
          messages: input.messages,
          usage: input.usage
        })
        .onConflictDoUpdate({
          target: chats.id,
          set: { messages: input.messages }
        })
    }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.chats.findMany({
        orderBy: (chats, { desc }) => [desc(chats.createdAt)],
        limit: input?.limit ?? 50,
        where: eq(chats.userId, ctx.session.user.id)
      })
    }),

  detail: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.id),
          eq(chats.userId, ctx.session.user.id)
        )
      })
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chat: z.object({
          title: z.string().trim().min(1).max(255).optional(),
          sharing: z.boolean().optional(),
          messages: z
            .array(
              z.object({
                id: z.string(),
                role: z.enum([
                  'system',
                  'user',
                  'assistant',
                  'function',
                  'data',
                  'tool'
                ]),
                content: z.string()
              })
            )
            .optional(),
          usage: z
            .object({
              model: z.string().trim().min(1),
              temperature: z.number().optional(),
              frequencyPenalty: z.number().optional(),
              presencePenalty: z.number().optional(),
              topP: z.number().optional(),
              topK: z.number().optional()
            })
            .optional()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(chats)
        .set({ ...input.chat })
        .where(
          and(eq(chats.id, input.id), eq(chats.userId, ctx.session.user.id))
        )
        .returning()
        .then(data => data[0])
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(chats)
        .where(
          and(eq(chats.id, input.id), eq(chats.userId, ctx.session.user.id))
        )
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(chats).where(eq(chats.userId, ctx.session.user.id))
  }),

  getShared: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.userId, ctx.session.user.id),
          eq(chats.id, input.id),
          eq(chats.sharing, true)
        )
      })
    })
})
