import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { artifacts } from '@/server/db/schema';

export const artifactRouter = createTRPCRouter({
  // All artifacts in a chat. Each artifact is an independent product of the
  // message that created it; the canvas switches between them.
  list: protectedProcedure
    .input(z.object({ chatId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.artifacts.findMany({
        where: and(
          eq(artifacts.chatId, input.chatId),
          eq(artifacts.userId, ctx.session.user.id)
        ),
        orderBy: (artifacts, { asc }) => [asc(artifacts.createdAt)],
        columns: {
          userId: false
        }
      });
    })
});
