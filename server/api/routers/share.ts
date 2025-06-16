import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { generateUUID } from '@/lib/utils';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { shares } from '@/server/db/schema';

export const shareRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        chatId: z.string().min(1)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const share = await ctx.db.query.shares.findFirst({
        where: eq(shares.chatId, input.chatId),
        columns: { chatId: false, userId: false }
      });

      if (share) {
        return share;
      }

      const shareId = generateUUID();
      const result = await ctx.db
        .insert(shares)
        .values({
          id: shareId,
          chatId: input.chatId,
          userId: ctx.session.user.id
        })
        .returning({
          id: shares.id,
          createdAt: shares.createdAt
        });

      return result[0];
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

      return await ctx.db.query.shares.findMany({
        orderBy: (shares, { desc }) => [desc(shares.createdAt)],
        limit: limit,
        offset: offset,
        where: eq(shares.userId, ctx.session.user.id),
        with: {
          chat: {
            columns: {
              userId: false
            }
          }
        },
        columns: {
          chatId: false,
          userId: false
        }
      });
    }),

  detail: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1)
      })
    )
    .query(async ({ ctx, input }) => {
      const share = await ctx.db.query.shares.findFirst({
        where: eq(shares.id, input.id),
        with: {
          chat: {
            with: {
              messages: {
                orderBy: (messages, { asc }) => [asc(messages.createdAt)],
                columns: {
                  chatId: false,
                  userId: false
                }
              }
            },
            columns: {
              userId: false
            }
          }
        }
      });

      return share?.chat;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(shares)
        .where(
          and(eq(shares.id, input.id), eq(shares.userId, ctx.session.user.id))
        );
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(shares).where(eq(shares.userId, ctx.session.user.id));
  })
});
