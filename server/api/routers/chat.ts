import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { messageSchema } from '@/types/message';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { chats, messages } from '@/server/db/schema';

export const chatRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        title: z.string().trim().min(1).max(255),
        messages: z
          .array(messageSchema)
          .length(1)
          .refine(messages => messages[0].role === 'user', {
            message: 'Messages must contain exactly one user message.'
          }),
        usage: z.object({
          model: z.string().min(1),
          temperature: z.number().optional(),
          frequencyPenalty: z.number().optional(),
          presencePenalty: z.number().optional(),
          maxTokens: z.number().optional()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.query.chats.findFirst({
        where: eq(chats.id, input.id)
      });

      if (chat) {
        throw new Error('Chat already exists');
      }

      await ctx.db.insert(chats).values({
        id: input.id,
        title: input.title,
        userId: ctx.session.user.id,
        usage: input.usage
      });

      const message = await ctx.db.query.messages.findFirst({
        where: eq(messages.id, input.messages[0].id)
      });

      if (message) {
        throw new Error('Message already exists');
      }

      await ctx.db.insert(messages).values({
        id: input.messages[0].id,
        content: input.messages[0].content ?? '',
        role: input.messages[0].role,
        chatId: input.id,
        userId: ctx.session.user.id
      });

      return await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.id),
          eq(chats.userId, ctx.session.user.id)
        ),
        with: {
          messages: {
            where: eq(messages.userId, ctx.session.user.id),
            orderBy: (messages, { asc }) => [asc(messages.createdAt)]
          }
        }
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        regenerateId: z.string().optional(),
        title: z.string().trim().min(1).max(255).optional(),
        shared: z.boolean().optional(),
        messages: z
          .array(messageSchema)
          .min(1)
          .max(2)
          .refine(
            messages =>
              (messages.length === 1 &&
                ['assistant'].includes(messages[0].role)) ||
              (messages.length === 2 &&
                messages[0].role === 'user' &&
                messages[1].role === 'assistant'),
            {
              message:
                'Messages must contain one user/assistant message or exactly one user message followed by one assistant message.'
            }
          )
          .optional(),
        usage: z
          .object({
            model: z.string().min(1),
            temperature: z.number().optional(),
            frequencyPenalty: z.number().optional(),
            presencePenalty: z.number().optional(),
            maxTokens: z.number().optional()
          })
          .optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, any> = {};
      if (input.title) updates.title = input.title;
      if (input.shared) updates.shared = input.shared;
      if (input.usage) updates.usage = input.usage;

      if (updates.title || updates.shared || updates.usage) {
        await ctx.db
          .update(chats)
          .set(updates)
          .where(
            and(eq(chats.id, input.id), eq(chats.userId, ctx.session.user.id))
          );
      }

      if (input.messages) {
        if (
          input.messages.length === 1 &&
          input.messages[0].role === 'assistant' &&
          input.regenerateId
        ) {
          await ctx.db
            .delete(messages)
            .where(
              and(
                eq(messages.id, input.regenerateId),
                eq(messages.chatId, input.id),
                eq(messages.userId, ctx.session.user.id)
              )
            );
        }

        const values = [];
        for (const message of input.messages) {
          const exists = await ctx.db.query.messages.findFirst({
            where: eq(messages.id, message.id)
          });
          if (!exists) {
            values.push({
              id: message.id,
              role: message.role,
              content: message.content ?? '',
              createdAt: message.createdAt,
              chatId: input.id,
              userId: ctx.session.user.id
            });
          }
        }

        if (values.length > 0) {
          await ctx.db.insert(messages).values(values);
        }
      }

      return await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.id),
          eq(chats.userId, ctx.session.user.id)
        ),
        with: {
          messages: {
            where: eq(messages.userId, ctx.session.user.id),
            orderBy: (messages, { asc }) => [asc(messages.createdAt)]
          }
        }
      });
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).default(50).optional(),
          offset: z.number().min(0).default(0).optional()
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      return await ctx.db.query.chats.findMany({
        orderBy: (chats, { desc }) => [desc(chats.createdAt)],
        limit: limit,
        offset: offset,
        where: eq(chats.userId, ctx.session.user.id)
      });
    }),

  detail: protectedProcedure
    .input(z.object({ chatId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const chat = await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.chatId),
          eq(chats.userId, ctx.session.user.id)
        ),
        with: {
          messages: {
            where: eq(messages.userId, ctx.session.user.id),
            orderBy: (messages, { asc }) => [asc(messages.createdAt)]
          }
        }
      });

      return chat;
    }),

  delete: protectedProcedure
    .input(z.object({ chatId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(chats)
        .where(
          and(eq(chats.id, input.chatId), eq(chats.userId, ctx.session.user.id))
        );
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(chats).where(eq(chats.userId, ctx.session.user.id));
  }),

  getShared: protectedProcedure
    .input(z.object({ chatId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.chats.findFirst({
        where: and(eq(chats.id, input.chatId), eq(chats.shared, true)),
        with: {
          messages: {
            where: eq(messages.userId, ctx.session.user.id),
            orderBy: (messages, { asc }) => [asc(messages.createdAt)]
          }
        }
      });
    }),

  updateMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.string().min(1),
        messageId: z.string().min(1),
        message: messageSchema.refine(msg => msg.role === 'user', {
          message: 'Only messages with role "user" can be updated.'
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(messages)
        .set({ ...input.message, updatedAt: new Date() })
        .where(
          and(
            eq(messages.id, input.messageId),
            eq(messages.chatId, input.chatId),
            eq(messages.userId, ctx.session.user.id)
          )
        )
        .returning()
        .then(data => data[0]);
    }),

  deleteMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.string().min(1),
        messageId: z.string().min(1)
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(messages)
        .where(
          and(
            eq(messages.id, input.messageId),
            eq(messages.chatId, input.chatId),
            eq(messages.userId, ctx.session.user.id)
          )
        );
    })
});
