import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';

import { generateUUID } from '@/lib/utils';
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure
} from '@/server/api/trpc';
import { models, prompts, settings } from '@/server/db/schema';

const promptCapabilitySchema = z.enum(['chat', 'image', 'video', 'audio']);
const providersSchema = z.array(z.string()).nullable().optional();

const promptCreateSchema = z.object({
  name: z.string().min(1).max(100),
  capability: promptCapabilitySchema,
  providers: providersSchema,
  image: z.string().max(500).nullable().optional(),
  content: z.string().min(1),
  displayOrder: z.number().int().default(0)
});

const promptUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  capability: promptCapabilitySchema.optional(),
  providers: providersSchema,
  image: z.string().max(500).nullable().optional(),
  content: z.string().min(1).optional(),
  displayOrder: z.number().int().optional()
});

const personalPromptUpdateSchema = promptUpdateSchema.extend({
  isPublic: z.boolean().optional()
});

const adminPromptTypeSchema = z.enum(['system', 'user']);
const adminPromptCreateSchema = promptCreateSchema.extend({
  type: adminPromptTypeSchema,
  isPublic: z.boolean()
});
const adminPromptUpdateSchema = promptUpdateSchema.extend({
  isPublic: z.boolean().optional()
});

const listInputSchema = z
  .object({
    capability: promptCapabilitySchema.optional()
  })
  .optional();

const adminListInputSchema = z
  .object({
    capability: promptCapabilitySchema.optional(),
    type: adminPromptTypeSchema.optional()
  })
  .optional();

const promptOrderBy = [asc(prompts.displayOrder), desc(prompts.createdAt)];

const capabilityWhere = (capability?: 'chat' | 'image' | 'video' | 'audio') =>
  capability ? eq(prompts.capability, capability) : undefined;

async function getPromptByIdOrThrow(
  ctx: { db: typeof import('@/server/db').db },
  id: string
) {
  const prompt = await ctx.db.query.prompts.findFirst({
    where: eq(prompts.id, id),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!prompt) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Prompt not found'
    });
  }

  return prompt;
}

async function assertSystemPromptCanBeDeleted(
  ctx: { db: typeof import('@/server/db').db },
  id: string
) {
  const [modelUsage, settingUsage] = await Promise.all([
    ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(models)
      .where(eq(models.systemPromptId, id)),
    ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(settings)
      .where(
        and(
          inArray(settings.key, [
            'default.chat.systemPrompt',
            'title.systemPrompt'
          ]),
          eq(settings.value, id)
        )
      )
  ]);

  if (
    Number(modelUsage[0]?.count || 0) > 0 ||
    Number(settingUsage[0]?.count || 0) > 0
  ) {
    throw new TRPCError({
      code: 'CONFLICT',
      message:
        'This system prompt is still referenced by a model or system setting'
    });
  }
}

function assertAdminPromptVisibility(
  type: 'system' | 'user',
  isPublic: boolean
) {
  if (type === 'system' && isPublic) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'System prompts cannot be public'
    });
  }

  if (type === 'user' && !isPublic) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Admin user prompts must be public'
    });
  }
}

export const promptRouter = createTRPCRouter({
  adminStats: adminProcedure.query(async ({ ctx }) => {
    const [totalRows, groupedRows] = await Promise.all([
      ctx.db.select({ count: sql<number>`count(*)` }).from(prompts),
      ctx.db
        .select({
          type: prompts.type,
          count: sql<number>`count(*)`
        })
        .from(prompts)
        .groupBy(prompts.type)
    ]);

    const system = Number(
      groupedRows.find(row => row.type === 'system')?.count || 0
    );
    const user = Number(
      groupedRows.find(row => row.type === 'user')?.count || 0
    );

    return {
      total: Number(totalRows[0]?.count || 0),
      system,
      user
    };
  }),

  adminList: adminProcedure
    .input(adminListInputSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.prompts.findMany({
        where: and(
          or(eq(prompts.type, 'system'), eq(prompts.ownerKind, 'admin')),
          input?.type ? eq(prompts.type, input.type) : undefined,
          capabilityWhere(input?.capability)
        ),
        orderBy: () => [asc(prompts.type), ...promptOrderBy],
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    }),

  list: protectedProcedure
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.prompts.findMany({
        where: and(
          eq(prompts.type, 'user'),
          eq(prompts.ownerKind, 'user'),
          eq(prompts.userId, ctx.session.user.id),
          capabilityWhere(input?.capability)
        ),
        orderBy: () => promptOrderBy
      });
    }),

  listUsable: protectedProcedure
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.prompts.findMany({
        columns: {
          id: true,
          name: true,
          capability: true,
          providers: true,
          image: true,
          content: true
        },
        where: and(
          eq(prompts.type, 'user'),
          capabilityWhere(input?.capability),
          or(
            eq(prompts.userId, ctx.session.user.id),
            eq(prompts.isPublic, true)
          )
        ),
        orderBy: () => promptOrderBy
      });
    }),

  adminCreate: adminProcedure
    .input(adminPromptCreateSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdminPromptVisibility(input.type, input.isPublic);
      const id = generateUUID();

      await ctx.db.insert(prompts).values({
        id,
        name: input.name,
        type: input.type,
        ownerKind: 'admin',
        userId: ctx.session.user.id,
        isPublic: input.isPublic,
        capability: input.capability,
        providers: input.providers,
        image: input.image,
        content: input.content,
        displayOrder: input.displayOrder
      });

      return { id };
    }),

  adminUpdate: adminProcedure
    .input(adminPromptUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const prompt = await getPromptByIdOrThrow(ctx, input.id);
      if (prompt.type !== 'system' && prompt.ownerKind !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admin prompts can be updated here'
        });
      }

      const { id, ...updates } = input;
      const nextIsPublic = updates.isPublic ?? prompt.isPublic;
      assertAdminPromptVisibility(prompt.type, nextIsPublic);

      await ctx.db
        .update(prompts)
        .set({
          ...updates,
          ownerKind: 'admin',
          userId: prompt.userId ?? ctx.session.user.id,
          isPublic: nextIsPublic,
          updatedAt: new Date()
        })
        .where(eq(prompts.id, id));
    }),

  adminDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const prompt = await getPromptByIdOrThrow(ctx, input.id);
      if (prompt.type !== 'system' && prompt.ownerKind !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admin prompts can be deleted here'
        });
      }

      if (prompt.type === 'system') {
        await assertSystemPromptCanBeDeleted(ctx, input.id);
      }

      await ctx.db.delete(prompts).where(eq(prompts.id, input.id));
    }),

  create: protectedProcedure
    .input(
      promptCreateSchema.extend({
        isPublic: z.boolean().default(false)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = generateUUID();

      await ctx.db.insert(prompts).values({
        id,
        name: input.name,
        type: 'user',
        ownerKind: 'user',
        userId: ctx.session.user.id,
        isPublic: input.isPublic,
        capability: input.capability,
        providers: input.providers,
        image: input.image,
        content: input.content,
        displayOrder: input.displayOrder
      });

      return { id };
    }),

  update: protectedProcedure
    .input(personalPromptUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const prompt = await getPromptByIdOrThrow(ctx, input.id);
      if (prompt.type !== 'user' || prompt.ownerKind !== 'user') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only personal prompts can be updated here'
        });
      }
      if (prompt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own prompts'
        });
      }

      const { id, ...updates } = input;

      await ctx.db
        .update(prompts)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(prompts.id, id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const prompt = await getPromptByIdOrThrow(ctx, input.id);
      if (prompt.type !== 'user' || prompt.ownerKind !== 'user') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only personal prompts can be deleted here'
        });
      }
      if (prompt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own prompts'
        });
      }

      await ctx.db.delete(prompts).where(eq(prompts.id, input.id));
    })
});
