import { and, eq, count } from 'drizzle-orm'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { chats, messages } from '@/server/db/schema'
import { type Usage } from '@/lib/types'

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
          frequencyPenalty: z.number().optional(),
          presencePenalty: z.number().optional(),
          topP: z.number().optional(),
          topK: z.number().optional(),
          maxTokens: z.number().optional()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.query.chats.findFirst({
        where: eq(chats.id, input.id)
      })
      if (!chat) {
        await ctx.db.insert(chats).values({
          id: input.id,
          title: input.title,
          userId: ctx.session.user.id,
          usage: input.usage as Usage
        })
      }

      const twoLastMessage = input.messages.slice(-2).map(message => ({
        id: message.id,
        content: message.content ?? '',
        role: message.role,
        chatId: input.id,
        userId: ctx.session.user.id
      }))
      await ctx.db.insert(messages).values(twoLastMessage)
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
      const chat = await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.id),
          eq(chats.userId, ctx.session.user.id)
        ),
        with: {
          messages: true
        }
      })

      return chat
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chat: z.object({
          title: z.string().trim().min(1).max(255).optional(),
          sharing: z.boolean().optional(),
          usage: z
            .object({
              model: z.string().trim().min(1),
              temperature: z.number().optional(),
              frequencyPenalty: z.number().optional(),
              presencePenalty: z.number().optional(),
              topP: z.number().optional(),
              topK: z.number().optional(),
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
        ),
        with: {
          messages: true
        }
      })
    }),

  updateMessage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chatId: z.string(),
        message: z.object({
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(messages)
        .set(input.message)
        .where(
          and(
            eq(messages.id, input.id),
            eq(messages.chatId, input.chatId),
            eq(messages.userId, ctx.session.user.id)
          )
        )
        .returning()
        .then(data => data[0])
    }),

  deleteMessage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chatId: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(messages)
        .where(
          and(
            eq(messages.id, input.id),
            eq(messages.chatId, input.chatId),
            eq(messages.userId, ctx.session.user.id)
          )
        )
    })
})
