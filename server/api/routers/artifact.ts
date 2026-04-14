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

const PREVIEWABLE_CODE_LANGUAGES = new Set([
  'react',
  'tsx',
  'jsx',
  'typescript',
  'javascript'
]);

const PREVIEW_IMPORT_RE =
  /\bimport\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;

const PREVIEW_ALLOWED_IMPORTS = new Set([
  'react',
  'react-dom',
  'react-dom/client'
]);

const looksLikeJsx = (code: string) =>
  /<\s*[A-Za-z][\w:-]*(\s|\/?>)/.test(code) || /<>\s*/.test(code);

const isRelativeImport = (specifier: string) =>
  specifier.startsWith('./') || specifier.startsWith('../');

const isStyleImport = (specifier: string) =>
  /\.css($|\?)/.test(specifier) ||
  /\.scss($|\?)/.test(specifier) ||
  /\.sass($|\?)/.test(specifier);

const validatePreviewImports = (code: string) => {
  const unsupported: string[] = [];

  for (const match of code.matchAll(PREVIEW_IMPORT_RE)) {
    const specifier = match[1] || match[2] || match[3];
    if (
      specifier &&
      !PREVIEW_ALLOWED_IMPORTS.has(specifier) &&
      !isRelativeImport(specifier) &&
      !isStyleImport(specifier)
    ) {
      unsupported.push(specifier);
    }
  }

  return Array.from(new Set(unsupported));
};

const assertArtifactPayload = (input: z.infer<typeof artifactBaseSchema>) => {
  const isFile = input.type === 'image' || input.type === 'file';
  if (isFile) {
    if (!input.fileUrl) {
      throw new Error('fileUrl is required for file/image artifacts');
    }
    return;
  }

  if (input.content == null) {
    throw new Error('content is required for non-file artifacts');
  }

  if (input.type !== 'code') {
    return;
  }

  const language = input.language?.toLowerCase().trim();
  if (!language || !PREVIEWABLE_CODE_LANGUAGES.has(language)) {
    return;
  }

  const fileName = input.fileName?.trim();
  if (!fileName) {
    throw new Error('Previewable React/code artifacts must include fileName');
  }

  if (!/^[A-Za-z0-9._/-]+\.[A-Za-z0-9]+$/.test(fileName)) {
    throw new Error(
      'Previewable React/code artifact fileName must be a valid relative file path'
    );
  }

  const unsupportedImports = validatePreviewImports(input.content);
  if (unsupportedImports.length > 0) {
    throw new Error(
      `Previewable React/code artifacts only support react imports and relative imports. Unsupported imports: ${unsupportedImports.join(', ')}`
    );
  }

  if (looksLikeJsx(input.content) && !/\.(tsx|jsx)$/i.test(fileName)) {
    throw new Error('Files containing JSX must use a .tsx or .jsx fileName');
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
