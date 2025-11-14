import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { chatTypeSchema, messageSchema } from '@/types';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { chats, messages } from '@/server/db/schema';

export const chatRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        title: z.string().trim().min(1).max(255),
        type: chatTypeSchema.default('chat'),
        model: z.string().trim().min(1).max(255),
        messages: z.array(messageSchema)
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(chats).values({
        id: input.id,
        title: input.title,
        type: input.type,
        model: input.model,
        userId: ctx.session.user.id
      });

      await ctx.db.insert(messages).values(
        input.messages.map(message => ({
          id: message.id,
          role: message.role,
          parts: message.parts,
          chatId: input.id,
          userId: ctx.session.user.id
        }))
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        title: z.string().trim().min(1).max(255).optional(),
        model: z.string().trim().min(1).max(255).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, any> = {};
      if (input.title) updates.title = input.title;
      if (input.model) updates.model = input.model;

      if (Object.keys(updates).length > 0) {
        await ctx.db
          .update(chats)
          .set({ ...updates, updatedAt: new Date() })
          .where(
            and(eq(chats.id, input.id), eq(chats.userId, ctx.session.user.id))
          );
      }
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          type: chatTypeSchema.optional(),
          limit: z.number().min(1).default(50).optional(),
          offset: z.number().min(0).default(0).optional()
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const type = input?.type;
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      return await ctx.db.query.chats.findMany({
        orderBy: (chats, { desc }) => [desc(chats.createdAt)],
        limit: limit,
        offset: offset,
        where: and(
          eq(chats.userId, ctx.session.user.id),
          type ? eq(chats.type, type) : undefined
        ),
        columns: {
          userId: false
        }
      });
    }),

  detail: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        type: chatTypeSchema.optional(),
        includeMessages: z.boolean().default(true)
      })
    )
    .query(async ({ ctx, input }) => {
      const chat = await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.id),
          eq(chats.userId, ctx.session.user.id),
          input.type ? eq(chats.type, input.type) : undefined
        ),
        with: {
          messages: input.includeMessages
            ? {
                where: eq(messages.userId, ctx.session.user.id),
                orderBy: (messages, { asc }) => [asc(messages.createdAt)],
                columns: {
                  userId: false,
                  chatId: false
                }
              }
            : undefined
        },
        columns: {
          userId: false
        }
      });

      return chat;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(chats)
        .where(
          and(eq(chats.id, input.id), eq(chats.userId, ctx.session.user.id))
        );
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(chats).where(eq(chats.userId, ctx.session.user.id));
  })
});
