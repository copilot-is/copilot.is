import { and, eq, inArray } from 'drizzle-orm';
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
              z.custom<URL>(data => data instanceof URL)
            ]),
            mimeType: z.string().optional()
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
            messages => {
              if (messages.length === 1) {
                return messages[0].role === 'assistant';
              } else if (messages.length === 2) {
                return (
                  messages[0].role === 'user' &&
                  messages[1].role === 'assistant'
                );
              }
              return false;
            },
            {
              message: 'Invalid messages'
            }
          ),
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
        where: eq(chats.id, input.chatId)
      });
      if (!chat) {
        await ctx.db.insert(chats).values({
          id: input.chatId,
          title: input.title,
          userId: ctx.session.user.id,
          usage: input.usage
        });
      }

      const userMessage = input.messages.find(m => m.role === 'user');
      const assistantMessage = input.messages.find(m => m.role === 'assistant');

      if (!userMessage && assistantMessage) {
        if (input.regenerateId) {
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

        await ctx.db.insert(messages).values({
          id: assistantMessage.id,
          content: assistantMessage.content ?? '',
          role: assistantMessage.role,
          chatId: input.chatId,
          userId: ctx.session.user.id
        });
      } else {
        if (userMessage && assistantMessage) {
          const exists = await ctx.db.query.messages.findFirst({
            where: and(
              inArray(
                messages.id,
                input.messages.map(m => m.id)
              ),
              eq(messages.chatId, input.chatId),
              eq(messages.userId, ctx.session.user.id)
            )
          });

          if (!exists) {
            await ctx.db.insert(messages).values([
              {
                id: userMessage.id,
                content: userMessage.content ?? '',
                role: userMessage.role,
                chatId: input.chatId,
                userId: ctx.session.user.id
              },
              {
                id: assistantMessage.id,
                content: assistantMessage.content ?? '',
                role: assistantMessage.role,
                chatId: input.chatId,
                userId: ctx.session.user.id
              }
            ]);
          }
        }
      }

      return await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.chatId),
          eq(chats.userId, ctx.session.user.id)
        ),
        with: {
          messages: true
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
          messages: true
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
      const updates: Record<string, any> = {};
      if ('title' in input.chat) updates.title = input.chat.title;
      if ('sharing' in input.chat) updates.sharing = input.chat.sharing;
      if ('usage' in input.chat) updates.usage = input.chat.usage;

      return await ctx.db
        .update(chats)
        .set(updates)
        .where(
          and(eq(chats.id, input.chatId), eq(chats.userId, ctx.session.user.id))
        )
        .returning()
        .then(data => data[0]);
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
        where: and(eq(chats.id, input.chatId), eq(chats.sharing, true)),
        with: {
          messages: true
        }
      });
    }),

  updateMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        chatId: z.string(),
        message: Message
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
        messageId: z.string(),
        chatId: z.string()
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
