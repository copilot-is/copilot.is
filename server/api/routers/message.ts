import { and, eq, or } from 'drizzle-orm';
import { z } from 'zod';

import { messageSchema } from '@/types';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { messages } from '@/server/db/schema';

export const messageRouter = createTRPCRouter({
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
            parentId: message.parentId,
            role: message.role,
            content: message.content,
            parts: message.parts,
            experimental_attachments: message.experimental_attachments || [],
            createdAt: message.createdAt,
            chatId: input.chatId,
            userId: ctx.session.user.id
          }))
        )
        .returning({
          id: messages.id,
          parentId: messages.parentId,
          role: messages.role,
          content: messages.content,
          parts: messages.parts,
          experimental_attachments: messages.experimental_attachments || [],
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
          ...input.message,
          createdAt: undefined,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(messages.id, input.message.id),
            eq(messages.userId, ctx.session.user.id)
          )
        )
        .returning({
          id: messages.id,
          parentId: messages.parentId,
          role: messages.role,
          content: messages.content,
          parts: messages.parts,
          experimental_attachments: messages.experimental_attachments || [],
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
      let conditions;

      if (input.id) {
        conditions = or(
          eq(messages.id, input.id),
          eq(messages.parentId, input.id)
        );
      } else if (input.parentId) {
        conditions = eq(messages.parentId, input.parentId);
      }

      await ctx.db
        .delete(messages)
        .where(and(conditions, eq(messages.userId, ctx.session.user.id)));
    })
});
