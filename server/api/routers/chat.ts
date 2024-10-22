import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { chats, messages } from '@/server/db/schema';

const Message = z.discriminatedUnion('role', [
  // CoreSystemMessage
  z.object({
    id: z.string(),
    role: z.literal('system'),
    content: z.string()
  }),
  // CoreUserMessage
  z.object({
    id: z.string(),
    role: z.literal('user'),
    content: z.union([
      z.string(),
      z.array(
        z.discriminatedUnion('type', [
          // TextPart
          z.object({
            type: z.literal('text'),
            text: z.string()
          }),
          // ImagePart
          z.object({
            type: z.literal('image'),
            image: z.union([
              z.string(),
              z.instanceof(Uint8Array),
              z.instanceof(ArrayBuffer),
              z.instanceof(Buffer),
              z.instanceof(URL)
            ]),
            mimeType: z.string().optional()
          }),
          // FilePart
          z.object({
            type: z.literal('file'),
            data: z.union([
              z.string(),
              z.instanceof(Uint8Array),
              z.instanceof(ArrayBuffer),
              z.instanceof(Buffer),
              z.instanceof(URL)
            ]),
            mimeType: z.string()
          })
        ])
      )
    ])
  }),
  // CoreAssistantMessage
  z.object({
    id: z.string(),
    role: z.literal('assistant'),
    content: z.union([
      z.string(),
      z.array(
        z.discriminatedUnion('type', [
          // TextPart
          z.object({
            type: z.literal('text'),
            text: z.string()
          }),
          // ToolCallPart
          z.object({
            type: z.literal('tool-call'),
            toolCallId: z.string(),
            toolName: z.string(),
            args: z.unknown()
          })
        ])
      )
    ])
  }),
  // CoreToolMessage
  z.object({
    id: z.string(),
    role: z.literal('tool'),
    content: z.array(
      z.object({
        type: z.literal('tool-result'),
        toolCallId: z.string(),
        toolName: z.string(),
        result: z.unknown(),
        isError: z.boolean().optional()
      })
    )
  })
]);

export const chatRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        regenerateId: z.string().optional(),
        title: z.string().trim().min(1).max(255),
        messages: z
          .array(Message)
          .min(1)
          .max(2)
          .refine(
            messages =>
              (messages.length === 1 &&
                ['user', 'assistant'].includes(messages[0].role)) ||
              (messages.length === 2 &&
                messages[0].role === 'user' &&
                messages[1].role === 'assistant'),
            {
              message:
                'Messages must contain one user/assistant message or exactly one user message followed by one assistant message.'
            }
          ),
        usage: z.object({
          model: z.string(),
          temperature: z.number().optional(),
          frequencyPenalty: z.number().optional(),
          presencePenalty: z.number().optional(),
          maxTokens: z.number().optional()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.query.chats.findFirst({
        where: eq(chats.id, input.chatId)
      });
      if (!chat) {
        await ctx.db.insert(chats).values({
          id: input.chatId,
          title: input.title,
          userId: ctx.session.user.id,
          usage: input.usage
        });
      } else {
        await ctx.db
          .update(chats)
          .set({ usage: input.usage })
          .where(
            and(
              eq(chats.id, input.chatId),
              eq(chats.userId, ctx.session.user.id)
            )
          );
      }

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
              eq(messages.chatId, input.chatId),
              eq(messages.userId, ctx.session.user.id)
            )
          );
      }

      const values = [];
      for (const message of input.messages) {
        const exists = await ctx.db.query.messages.findFirst({
          where: and(
            eq(messages.id, message.id),
            eq(messages.chatId, input.chatId),
            eq(messages.userId, ctx.session.user.id)
          )
        });
        if (!exists) {
          values.push({
            id: message.id,
            content: message.content ?? '',
            role: message.role,
            chatId: input.chatId,
            userId: ctx.session.user.id
          });
        }
      }

      if (values.length > 0) {
        await ctx.db.insert(messages).values(values);
      }

      return await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.chatId),
          eq(chats.userId, ctx.session.user.id)
        ),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.createdAt)]
          }
        }
      });
    }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.chats.findMany({
        orderBy: (chats, { desc }) => [desc(chats.createdAt)],
        limit: input?.limit ?? 50,
        where: eq(chats.userId, ctx.session.user.id)
      });
    }),

  detail: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }) => {
      const chat = await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.chatId),
          eq(chats.userId, ctx.session.user.id)
        ),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.createdAt)]
          }
        }
      });

      return chat;
    }),

  update: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        chat: z.object({
          title: z.string().trim().min(1).max(255).optional(),
          shared: z.boolean().optional(),
          usage: z
            .object({
              model: z.string().trim().min(1),
              temperature: z.number().optional(),
              frequencyPenalty: z.number().optional(),
              presencePenalty: z.number().optional(),
              maxTokens: z.number().optional()
            })
            .optional()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, any> = {};
      if ('title' in input.chat) updates.title = input.chat.title;
      if ('shared' in input.chat) updates.shared = input.chat.shared;
      if ('usage' in input.chat) updates.usage = input.chat.usage;

      await ctx.db
        .update(chats)
        .set(updates)
        .where(
          and(eq(chats.id, input.chatId), eq(chats.userId, ctx.session.user.id))
        );

      return await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.chatId),
          eq(chats.userId, ctx.session.user.id)
        ),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.createdAt)]
          }
        }
      });
    }),

  delete: protectedProcedure
    .input(z.object({ chatId: z.string() }))
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
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.chats.findFirst({
        where: and(eq(chats.id, input.chatId), eq(chats.shared, true)),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.createdAt)]
          }
        }
      });
    }),

  updateMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        messageId: z.string(),
        message: Message.refine(msg => msg.role === 'user', {
          message: 'Only messages with role "user" can be updated.'
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(messages)
        .set(input.message)
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
        chatId: z.string(),
        messageId: z.string()
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
