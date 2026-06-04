import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

import type { UsageRow, UserUsageRow } from '@/types';
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure
} from '@/server/api/trpc';
import { models, providers, usage, users } from '@/server/db/schema';

// `from` is an absolute instant computed client-side from the user's LOCAL
// calendar-day boundary (start of (today - N + 1) at local 00:00). The server
// does no timezone math — it filters `createdAt >= from` on the timestamptz
// column, a pure instant comparison. This keeps the KPI window and the
// browser's local-day chart buckets aligned (KPI total == sum of bars).

// =============================================================================
// KPI tile aggregate — TZ-independent (sums over the whole window)
//
// `queryKpi` is admin-facing and returns cost. `queryKpiUser` strips the
// dollar field — user-end procedures must never expose cost.
// =============================================================================
async function queryKpiUser(
  ctx: { db: typeof import('@/server/db').db },
  args: { since: Date; userId: string }
) {
  const { totalCost: _totalCost, ...tokensOnly } = await queryKpi(ctx, args);
  return tokensOnly;
}

async function queryUsageRowsUser(
  ctx: { db: typeof import('@/server/db').db },
  args: { since: Date; userId: string }
): Promise<UserUsageRow[]> {
  const rows = await queryUsageRows(ctx, args);
  return rows.map(({ cost: _cost, ...rest }) => rest);
}

async function queryKpi(
  ctx: { db: typeof import('@/server/db').db },
  args: { since: Date; userId?: string }
) {
  const baseWhere = and(
    gte(usage.createdAt, args.since),
    args.userId ? eq(usage.userId, args.userId) : undefined
  );
  const rows = await ctx.db
    .select({
      totalCost: sql<string>`coalesce(sum(${usage.cost}), 0)`,
      requests: sql<number>`count(*)`,
      inputTokens: sql<number>`coalesce(sum(${usage.inputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${usage.outputTokens}), 0)`,
      cacheReadTokens: sql<number>`coalesce(sum(${usage.cacheReadTokens}), 0)`,
      cacheWriteTokens: sql<number>`coalesce(sum(${usage.cacheWriteTokens}), 0)`,
      reasoningTokens: sql<number>`coalesce(sum(${usage.reasoningTokens}), 0)`
    })
    .from(usage)
    .where(baseWhere);
  const row = rows[0];
  return {
    totalCost: row?.totalCost ?? '0',
    requests: Number(row?.requests ?? 0),
    inputTokens: Number(row?.inputTokens ?? 0),
    outputTokens: Number(row?.outputTokens ?? 0),
    cacheReadTokens: Number(row?.cacheReadTokens ?? 0),
    cacheWriteTokens: Number(row?.cacheWriteTokens ?? 0),
    reasoningTokens: Number(row?.reasoningTokens ?? 0)
  };
}

// =============================================================================
// Raw rows — no day bucketing happens here. The browser will group these by
// its own local calendar day, which is the only TZ-aware authority in the
// pipeline (and the same TZ used to render the Logs table — guarantees the
// chart and the Logs agree on which day a record belongs to).
// =============================================================================

async function queryUsageRows(
  ctx: { db: typeof import('@/server/db').db },
  args: { since: Date; userId?: string }
): Promise<UsageRow[]> {
  const where = and(
    gte(usage.createdAt, args.since),
    args.userId ? eq(usage.userId, args.userId) : undefined
  );
  const rows = await ctx.db
    .select({
      id: usage.id,
      createdAt: usage.createdAt,
      modelId: usage.modelId,
      providerId: providers.id,
      providerName: providers.name,
      capability: usage.capability,
      cost: usage.cost,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheReadTokens: usage.cacheReadTokens,
      cacheWriteTokens: usage.cacheWriteTokens,
      reasoningTokens: usage.reasoningTokens
    })
    .from(usage)
    .leftJoin(models, eq(models.modelId, usage.modelId))
    .leftJoin(providers, eq(providers.id, models.providerId))
    .where(where)
    .orderBy(usage.createdAt);
  return rows.map(r => ({
    id: r.id,
    createdAt: r.createdAt,
    modelId: r.modelId,
    providerId: r.providerId,
    providerName: r.providerName,
    capability: r.capability,
    cost: r.cost ?? '0',
    inputTokens: Number(r.inputTokens ?? 0),
    outputTokens: Number(r.outputTokens ?? 0),
    cacheReadTokens: Number(r.cacheReadTokens ?? 0),
    cacheWriteTokens: Number(r.cacheWriteTokens ?? 0),
    reasoningTokens: Number(r.reasoningTokens ?? 0)
  }));
}

export const usageRouter = createTRPCRouter({
  // =========================================================================
  // /settings/usage — calling user's own usage
  // =========================================================================
  me: protectedProcedure
    .input(z.object({ from: z.date() }))
    .query(async ({ ctx, input }) => {
      const since = input.from;
      const [kpi, rows] = await Promise.all([
        queryKpiUser(ctx, { since, userId: ctx.session.user.id }),
        queryUsageRowsUser(ctx, { since, userId: ctx.session.user.id })
      ]);
      return { kpi, rows };
    }),

  // =========================================================================
  // /console/users/[id] — admin view of a specific user
  // =========================================================================
  adminByUser: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        from: z.date()
      })
    )
    .query(async ({ ctx, input }) => {
      const since = input.from;
      const [kpi, rows] = await Promise.all([
        queryKpi(ctx, { since, userId: input.userId }),
        queryUsageRows(ctx, { since, userId: input.userId })
      ]);
      return { kpi, rows };
    }),

  // =========================================================================
  // /console/usage — admin global view
  // =========================================================================
  adminList: adminProcedure
    .input(z.object({ from: z.date() }))
    .query(async ({ ctx, input }) => {
      const since = input.from;
      const [kpi, rows] = await Promise.all([
        queryKpi(ctx, { since }),
        queryUsageRows(ctx, { since })
      ]);
      return { kpi, rows };
    }),

  // =========================================================================
  // Admin: distinct models a specific user has used (filter UI on user detail)
  // =========================================================================
  adminUserModels: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ modelId: usage.modelId })
        .from(usage)
        .where(eq(usage.userId, input.userId))
        .groupBy(usage.modelId)
        .orderBy(usage.modelId);
      return rows.map(r => r.modelId).filter((id): id is string => Boolean(id));
    }),

  // =========================================================================
  // Admin usage log — paginated + filterable
  // =========================================================================
  adminLog: adminProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        userId: z.string().optional(),
        userQuery: z.string().optional(),
        modelId: z.string().optional(),
        capability: z.enum(['chat', 'image', 'video', 'audio']).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(200).default(50)
      })
    )
    .query(async ({ ctx, input }) => {
      const whereParts = [
        input.from ? gte(usage.createdAt, input.from) : undefined,
        input.to ? lte(usage.createdAt, input.to) : undefined,
        input.userId ? eq(usage.userId, input.userId) : undefined,
        input.modelId ? eq(usage.modelId, input.modelId) : undefined,
        input.capability ? eq(usage.capability, input.capability) : undefined
      ];

      let userIds: string[] | null = null;
      if (input.userQuery?.trim()) {
        const q = `%${input.userQuery.trim()}%`;
        const matched = await ctx.db
          .select({ id: users.id })
          .from(users)
          .where(sql`(${users.name} ilike ${q} or ${users.email} ilike ${q})`)
          .limit(200);
        userIds = matched.map(u => u.id);
        if (userIds.length === 0) {
          return {
            rows: [],
            total: 0,
            page: input.page,
            pageSize: input.pageSize
          };
        }
      }
      const userWhere =
        userIds !== null
          ? sql`${usage.userId} in (${sql.join(
              userIds.map(id => sql`${id}`),
              sql`, `
            )})`
          : undefined;

      const where = and(...whereParts.filter(Boolean), userWhere);

      const [totalRow] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(usage)
        .where(where);
      const total = Number(totalRow?.count ?? 0);

      const rows = await ctx.db
        .select({
          id: usage.id,
          createdAt: usage.createdAt,
          userId: usage.userId,
          userName: users.name,
          userEmail: users.email,
          modelId: usage.modelId,
          capability: usage.capability,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheReadTokens: usage.cacheReadTokens,
          cacheWriteTokens: usage.cacheWriteTokens,
          reasoningTokens: usage.reasoningTokens,
          imageCount: usage.imageCount,
          videoCount: usage.videoCount,
          videoSeconds: usage.videoSeconds,
          audioInputTokens: usage.audioInputTokens,
          audioOutputTokens: usage.audioOutputTokens,
          audioCharacters: usage.audioCharacters,
          inputPrice: usage.inputPrice,
          outputPrice: usage.outputPrice,
          cacheReadPrice: usage.cacheReadPrice,
          cacheWritePrice: usage.cacheWritePrice,
          reasoningPrice: usage.reasoningPrice,
          imagePrice: usage.imagePrice,
          videoPrice: usage.videoPrice,
          videoSecondsPrice: usage.videoSecondsPrice,
          audioInputPrice: usage.audioInputPrice,
          audioOutputPrice: usage.audioOutputPrice,
          audioCharactersPrice: usage.audioCharactersPrice,
          cost: usage.cost
        })
        .from(usage)
        .leftJoin(users, eq(users.id, usage.userId))
        .where(where)
        .orderBy(desc(usage.createdAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);

      return { rows, total, page: input.page, pageSize: input.pageSize };
    })
});
