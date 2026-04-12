import { eq } from 'drizzle-orm';
import { z } from 'zod';

import type { VertexServiceAccountKey } from '@/types';
import { decrypt, encrypt, maskedKey } from '@/lib/crypto';
import { generateUUID } from '@/lib/utils';
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure
} from '@/server/api/trpc';
import { providers } from '@/server/db/schema';

export const providerRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.providers.findMany({
      orderBy: (providers, { asc, desc }) => [
        asc(providers.displayOrder),
        desc(providers.createdAt)
      ],
      with: {
        models: true
      }
    });
    return result.map(({ apiKey, ...provider }) => ({
      ...provider,
      maskedKey: maskedKey(provider.type, apiKey)
    }));
  }),

  getEnabled: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.providers.findMany({
      where: eq(providers.isEnabled, true),
      orderBy: (providers, { asc, desc }) => [
        asc(providers.displayOrder),
        desc(providers.createdAt)
      ],
      columns: {
        apiKey: false // Mask API key for public access
      }
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.enum([
          'openai',
          'azure',
          'google',
          'vertex',
          'anthropic',
          'bedrock',
          'xai',
          'deepseek'
        ]),
        apiKey: z.string().min(1),
        image: z.string().optional(),
        baseUrl: z.string().url().optional().or(z.literal('')),
        isEnabled: z.boolean().default(false),
        apiOptions: z.record(z.string(), z.any()).optional(),
        displayOrder: z.number().int().default(0)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = generateUUID();

      await ctx.db.insert(providers).values({
        id,
        name: input.name,
        type: input.type,
        apiKey: encrypt(input.apiKey.trim()),
        image: input.image,
        baseUrl: input.baseUrl || null,
        isEnabled: input.isEnabled,
        apiOptions: input.apiOptions,
        displayOrder: input.displayOrder
      });
      return { id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        type: z.enum([
          'openai',
          'azure',
          'google',
          'vertex',
          'anthropic',
          'bedrock',
          'xai',
          'deepseek'
        ]),
        apiKey: z.string().optional(),
        image: z.string().optional(),
        baseUrl: z.url().optional().or(z.literal('')),
        isEnabled: z.boolean().optional(),
        apiOptions: z.record(z.string(), z.any()).nullable().optional(),
        displayOrder: z.number().int().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingProvider = await ctx.db.query.providers.findFirst({
        where: eq(providers.id, input.id)
      });

      if (!existingProvider) {
        throw new Error('Provider not found');
      }

      const { id, apiKey, apiOptions, baseUrl, ...updates } = input;
      let resolvedApiKey = apiKey;

      if (input.type === 'vertex' && apiKey) {
        let vertexKey: VertexServiceAccountKey | null = null;

        try {
          vertexKey = JSON.parse(apiKey) as VertexServiceAccountKey;
        } catch {}

        if (vertexKey?.location && !vertexKey.credentials) {
          const existingApiKey = existingProvider.apiKey
            ? decrypt(existingProvider.apiKey)
            : undefined;
          let existingVertexKey: VertexServiceAccountKey | null = null;

          if (existingApiKey) {
            try {
              existingVertexKey = JSON.parse(
                existingApiKey
              ) as VertexServiceAccountKey;
            } catch {}
          }

          if (existingVertexKey?.credentials) {
            resolvedApiKey = JSON.stringify({
              location: vertexKey.location,
              credentials: existingVertexKey.credentials
            });
          } else {
            throw new Error('Invalid existing Google Vertex AI credentials');
          }
        }
      }

      await ctx.db
        .update(providers)
        .set({
          ...updates,
          ...(resolvedApiKey && {
            apiKey: encrypt(resolvedApiKey.trim())
          }),
          ...(baseUrl !== undefined && { baseUrl: baseUrl || null }),
          ...(apiOptions !== undefined && { apiOptions }),
          updatedAt: new Date()
        })
        .where(eq(providers.id, id));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // This will fail if provider has models due to FK constraint
      await ctx.db.delete(providers).where(eq(providers.id, input.id));
    }),

  toggleEnabled: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        isEnabled: z.boolean()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(providers)
        .set({ isEnabled: input.isEnabled, updatedAt: new Date() })
        .where(eq(providers.id, input.id));
    })
});
