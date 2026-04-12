import { and, eq, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

import { artifactTypeSchema } from '@/types';
import { generateUUID } from '@/lib/utils';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { artifacts, chats, messages } from '@/server/db/schema';

const artifactBaseSchema = z.object({
  id: z.string().min(1).optional(),
  chatId: z.string().min(1),
  messageId: z.string().min(1),
  title: z.string().trim().min(1).max(255),
  type: artifactTypeSchema,
  language: z.string().trim().max(64).nullable().optional(),
  content: z.string().nullable().optional(),
  fileUrl: z.url().nullable().optional(),
  fileName: z.string().trim().max(255).nullable().optional(),
  mimeType: z.string().trim().max(255).nullable().optional(),
  size: z.number().int().nonnegative().nullable().optional()
});

const assertArtifactPayload = (input: z.infer<typeof artifactBaseSchema>) => {
  const isFile = input.type === 'image' || input.type === 'file';
  if (isFile) {
    if (!input.fileUrl) {
      throw new Error('fileUrl is required for file/image artifacts');
    }
  } else if (input.content == null) {
    throw new Error('content is required for non-file artifacts');
  }
};

export const artifactRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ chatId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.artifacts.findMany({
        where: and(
          eq(artifacts.chatId, input.chatId),
          eq(artifacts.userId, ctx.session.user.id),
          isNotNull(artifacts.messageId)
        ),
        orderBy: (artifacts, { asc }) => [asc(artifacts.createdAt)],
        columns: {
          userId: false
        }
      });
    }),

  create: protectedProcedure
    .input(artifactBaseSchema)
    .mutation(async ({ ctx, input }) => {
      assertArtifactPayload(input);

      const chat = await ctx.db.query.chats.findFirst({
        where: and(
          eq(chats.id, input.chatId),
          eq(chats.userId, ctx.session.user.id)
        ),
        columns: { id: true }
      });

      if (!chat) {
        throw new Error('Chat not found');
      }

      const message = await ctx.db.query.messages.findFirst({
        where: and(
          eq(messages.id, input.messageId),
          eq(messages.chatId, input.chatId),
          eq(messages.userId, ctx.session.user.id)
        ),
        columns: { id: true }
      });

      if (!message) {
        throw new Error('Message not found');
      }

      const now = new Date();
      const artifactId = input.id ?? generateUUID();

      const artifactValues = {
        id: artifactId,
        chatId: input.chatId,
        messageId: input.messageId,
        userId: ctx.session.user.id,
        title: input.title,
        type: input.type,
        language: input.language ?? null,
        content: input.content ?? null,
        fileUrl: input.fileUrl ?? null,
        fileName: input.fileName ?? null,
        mimeType: input.mimeType ?? null,
        size: input.size ?? null,
        createdAt: now,
        updatedAt: now
      };

      await ctx.db.insert(artifacts).values(artifactValues);

      return artifactValues;
    })
});
