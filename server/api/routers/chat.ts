import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { chats } from '@/server/db/schema'
import { Message, type Usage } from '@/lib/types'

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
              content: z.union([
                z.string(),
                z.array(
                  z
                    .object({
                      type: z.enum(['text', 'image']),
                      text: z.string().optional(),
                      data: z.string().optional()
                    })
                    .refine(data => (data.text || data.data) !== undefined, {
                      message: 'Either text or data must be provided'
                    })
                )
              ])
            })
          )
          .nonempty(),
        usage: z.object({
          model: z.string(),
          temperature: z.number().optional(),
          maxTokens: z.number().optional()
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
          messages: input.messages as Message[],
          usage: input.usage as Usage
        })
        .onConflictDoUpdate({
          target: chats.id,
          set: { messages: input.messages as Message[] }
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
                content: z.union([
                  z.string(),
                  z.array(
                    z
                      .object({
                        type: z.enum(['text', 'image']),
                        text: z.string().optional(),
                        data: z.string().optional()
                      })
                      .refine(data => (data.text || data.data) !== undefined, {
                        message: 'Either text or data must be provided'
                      })
                  )
                ])
              })
            )
            .optional(),
          usage: z
            .object({
              model: z.string().trim().min(1),
              temperature: z.number().optional(),
              maxTokens: z.number().optional()
            })
            .optional()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, any> = {}
      if ('title' in input.chat) updates.title = input.chat.title
      if ('sharing' in input.chat) updates.sharing = input.chat.sharing
      if ('messages' in input.chat) updates.messages = input.chat.messages
      if ('usage' in input.chat) updates.usage = input.chat.usage

      return await ctx.db
        .update(chats)
        .set(updates)
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
