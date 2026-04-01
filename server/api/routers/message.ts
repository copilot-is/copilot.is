import { and, eq, inArray, or } from 'drizzle-orm';
import { z } from 'zod';

import { messageSchema } from '@/types';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { artifacts, messages } from '@/server/db/schema';

export const messageRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ chatId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.messages.findMany({
        where: and(
          eq(messages.chatId, input.chatId),
          eq(messages.userId, ctx.session.user.id)
        ),
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        columns: {
          userId: false,
          chatId: false
        }
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        chatId: z.string().min(1),
        messages: z.array(messageSchema)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(messages)
        .values(
          input.messages.map(message => ({
            id: message.id,
            parentId: message.metadata?.parentId,
            role: message.role,
            parts: message.parts,
            chatId: input.chatId,
            userId: ctx.session.user.id,
            reasonDuration: message.metadata?.reasonDuration,
            createdAt: message.metadata?.createdAt,
            updatedAt: message.metadata?.updatedAt
          }))
        )
        .returning({
          id: messages.id,
          parentId: messages.parentId,
          role: messages.role,
          parts: messages.parts,
          reasonDuration: messages.reasonDuration,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt
        });

      return result[0];
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        message: messageSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(messages)
        .set({
          parts: input.message.parts,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(messages.id, input.message.id),
            eq(messages.userId, ctx.session.user.id),
            eq(messages.role, 'user') // Only allow editing user messages
          )
        )
        .returning({
          id: messages.id,
          parentId: messages.parentId,
          role: messages.role,
          parts: messages.parts,
          reasonDuration: messages.reasonDuration,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt
        });

      return result[0];
    }),

  delete: protectedProcedure
    .input(
      z
        .object({
          id: z.string().trim().min(1).optional(),
          parentId: z.string().trim().min(1).optional()
        })
        .refine(data => !!data.id !== !!data.parentId, {
          message: 'Provide either id or parentId, but not both or neither'
        })
    )
    .mutation(async ({ ctx, input }) => {
      const conditions = input.id
        ? or(eq(messages.id, input.id), eq(messages.parentId, input.id))
        : eq(messages.parentId, input.parentId!);

      await ctx.db.transaction(async tx => {
        const targetMessages = await tx
          .select({ id: messages.id })
          .from(messages)
          .where(and(conditions, eq(messages.userId, ctx.session.user.id)));

        const targetMessageIds = targetMessages.map(message => message.id);

        if (targetMessageIds.length > 0) {
          await tx
            .delete(artifacts)
            .where(
              and(
                inArray(artifacts.messageId, targetMessageIds),
                eq(artifacts.userId, ctx.session.user.id)
              )
            );
        }

        await tx
          .delete(messages)
          .where(and(conditions, eq(messages.userId, ctx.session.user.id)));
      });
    })
});
