import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { generateUUID } from '@/lib/utils';
import { adminProcedure, createTRPCRouter } from '@/server/api/trpc';
import { models, prompts } from '@/server/db/schema';

const capabilitySchema = z.enum(['chat', 'image', 'video', 'audio']);

export const modelRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          capability: capabilitySchema.optional(),
          providerId: z.string().optional()
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.models.findMany({
        where: and(
          input?.capability
            ? eq(models.capability, input.capability)
            : undefined,
          input?.providerId
            ? eq(models.providerId, input.providerId)
            : undefined
        ),
        orderBy: (models, { asc, desc }) => [
          asc(models.displayOrder),
          desc(models.createdAt)
        ],
        with: {
          provider: true,
          systemPrompt: true
        }
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        modelId: z.string().min(1).max(255),
        providerId: z.string().min(1),
        capability: capabilitySchema,
        image: z.string().optional(),
        aliases: z.array(z.string()).optional(),
        supportsVision: z.boolean().default(false),
        supportsReasoning: z.boolean().default(false),
        isEnabled: z.boolean().default(true),
        uiOptions: z
          .object({
            size: z.string().optional(),
            sizes: z.array(z.string()).optional(),
            aspectRatio: z.string().optional(),
            aspectRatios: z.array(z.string()).optional(),
            duration: z.number().optional(),
            durations: z.array(z.number()).optional(),
            resolution: z.string().optional(),
            resolutions: z.array(z.string()).optional(),
            voice: z.string().optional(),
            voices: z.array(z.string()).optional(),
            reasoning: z.boolean().optional()
          })
          .strict()
          .optional(),
        apiParams: z
          .object({
            temperature: z.number().optional(),
            topP: z.number().optional(),
            topK: z.number().optional(),
            maxOutputTokens: z.number().optional(),
            frequencyPenalty: z.number().optional(),
            presencePenalty: z.number().optional()
          })
          .strict()
          .optional(),
        systemPromptId: z.string().optional(),
        displayOrder: z.number().int().default(0)
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate system prompt is of type 'system'
      if (input.systemPromptId) {
        const prompt = await ctx.db.query.prompts.findFirst({
          where: and(
            eq(prompts.id, input.systemPromptId),
            eq(prompts.type, 'system')
          )
        });
        if (!prompt) {
          throw new Error('System prompt must be of type "system"');
        }
      }

      const id = generateUUID();
      await ctx.db.insert(models).values({
        id,
        name: input.name,
        modelId: input.modelId,
        providerId: input.providerId,
        capability: input.capability,
        image: input.image,
        aliases: input.aliases,
        supportsVision: input.supportsVision,
        supportsReasoning: input.supportsReasoning,
        isEnabled: input.isEnabled,
        uiOptions: input.uiOptions,
        apiParams: input.apiParams,
        systemPromptId: input.systemPromptId,
        displayOrder: input.displayOrder
      });
      return { id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        modelId: z.string().min(1).max(255).optional(),
        providerId: z.string().min(1).optional(),
        capability: capabilitySchema.optional(),
        image: z.string().optional(),
        aliases: z.array(z.string()).optional(),
        supportsVision: z.boolean().optional(),
        supportsReasoning: z.boolean().optional(),
        isEnabled: z.boolean().optional(),
        uiOptions: z
          .object({
            size: z.string().optional(),
            sizes: z.array(z.string()).optional(),
            aspectRatio: z.string().optional(),
            aspectRatios: z.array(z.string()).optional(),
            duration: z.number().optional(),
            durations: z.array(z.number()).optional(),
            resolution: z.string().optional(),
            resolutions: z.array(z.string()).optional(),
            voice: z.string().optional(),
            voices: z.array(z.string()).optional(),
            reasoning: z.boolean().optional()
          })
          .strict()
          .nullable()
          .optional(),
        apiParams: z
          .object({
            temperature: z.number().optional(),
            topP: z.number().optional(),
            topK: z.number().optional(),
            maxOutputTokens: z.number().optional(),
            frequencyPenalty: z.number().optional(),
            presencePenalty: z.number().optional()
          })
          .strict()
          .nullable()
          .optional(),
        systemPromptId: z.string().nullable().optional(),
        displayOrder: z.number().int().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Validate system prompt is of type 'system'
      if (updates.systemPromptId) {
        const prompt = await ctx.db.query.prompts.findFirst({
          where: and(
            eq(prompts.id, updates.systemPromptId),
            eq(prompts.type, 'system')
          )
        });
        if (!prompt) {
          throw new Error('System prompt must be of type "system"');
        }
      }

      await ctx.db
        .update(models)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(models.id, id));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(models).where(eq(models.id, input.id));
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
        .update(models)
        .set({ isEnabled: input.isEnabled, updatedAt: new Date() })
        .where(eq(models.id, input.id));
    })
});
