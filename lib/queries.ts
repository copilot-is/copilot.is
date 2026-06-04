import 'server-only';

import { cache } from 'react';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';

import type { ResolvedSource } from '@/types';
import { parseNumber } from '@/lib/utils';
import { db } from '@/server/db';
import {
  models,
  prompts,
  providers,
  quotas,
  settings,
  usage,
  users
} from '@/server/db/schema';

// ============================================================================
// Types
// ============================================================================

type Provider = typeof providers.$inferSelect;
type Model = typeof models.$inferSelect & {
  provider: Provider | null;
};
type QuotaRow = typeof quotas.$inferSelect;

const FIVE_HOUR_MS = 5 * 60 * 60 * 1000;
const SEVEN_DAY_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// Internal Query Helpers
// ============================================================================

const getAllModels = cache(async (): Promise<Model[]> => {
  const result = await db.query.models.findMany({
    where: eq(models.isEnabled, true),
    with: {
      provider: true
    },
    orderBy: (models, { asc }) => [asc(models.displayOrder)]
  });

  return result
    .filter(m => m.provider?.isEnabled)
    .map(m => ({
      ...m,
      provider: m.provider || null
    }));
});

// ============================================================================
// Model Queries
// ============================================================================

export const findModelByModelId = cache(
  async (
    modelId: string,
    capability?: 'chat' | 'image' | 'video' | 'audio'
  ): Promise<Model | undefined> => {
    const allModels = await getAllModels();

    return allModels.find(m => {
      if (capability && m.capability !== capability) return false;
      const aliases = m.aliases as string[] | null;
      return m.modelId === modelId || aliases?.includes(modelId);
    });
  }
);

// ============================================================================
// Prompt Queries
// ============================================================================

type PromptRecord = typeof prompts.$inferSelect;

const getPromptRecordById = cache(
  async (id: string): Promise<PromptRecord | null> => {
    const result = await db.select().from(prompts).where(eq(prompts.id, id));
    return result[0] ?? null;
  }
);

const getSystemPromptContentById = cache(
  async (id: string): Promise<string | null> => {
    const prompt = await getPromptRecordById(id);

    if (!prompt || prompt.type !== 'system') {
      return null;
    }

    return prompt.content;
  }
);

// ============================================================================
// Settings Queries
// ============================================================================

/** System default quota id (setting `default.quotaId`). Applied to users
 *  with no plan and no override. `null` = unconfigured (free unlimited). */
export const getDefaultQuotaId = cache(async (): Promise<string | null> => {
  const values = await getSettings(['default.quotaId']);
  return values['default.quotaId'];
});

export const getSpeechSettings = cache(async () => {
  const values = await getSettings([
    'speech.enabled',
    'default.speech.modelId',
    'default.speech.voice'
  ]);

  return {
    speechEnabled: values['speech.enabled'] === 'true',
    defaultModel: values['default.speech.modelId'],
    defaultVoice: values['default.speech.voice'] || undefined
  };
});

const DEFAULT_TITLE_PROMPT = `
- you will generate a short title based on the first message a user begins a conversation with
- ensure it is not more than 80 characters long
- the title should be a summary of the user's message
- do not use quotes or colons
`.trim();

export const getTitleSettings = cache(async () => {
  const values = await getSettings(['title.systemPrompt', 'title.modelId']);
  const promptId = values['title.systemPrompt'];
  const modelId = values['title.modelId'];

  const model = modelId ? await findModelByModelId(modelId) : undefined;
  const prompt = promptId ? await getSystemPromptContentById(promptId) : null;

  return {
    prompt: prompt || DEFAULT_TITLE_PROMPT,
    modelId,
    provider: model?.provider ?? null
  };
});

// ============================================================================
//  System Prompt
// ============================================================================

export const getSystemPrompt = cache(
  async (promptId?: string | null): Promise<string | null> => {
    if (promptId) {
      const content = await getSystemPromptContentById(promptId);
      if (content) return content;
    }
    const values = await getSettings(['default.chat.systemPrompt']);
    const defaultPromptId = values['default.chat.systemPrompt'];
    if (!defaultPromptId) return null;
    return getSystemPromptContentById(defaultPromptId);
  }
);

const getSettings = cache(
  async (keys: string[]): Promise<Record<string, string | null>> => {
    if (keys.length === 0) {
      return {};
    }

    try {
      const results = await db
        .select({ key: settings.key, value: settings.value })
        .from(settings)
        .where(inArray(settings.key, keys));

      const resultMap = new Map(results.map(r => [r.key, r.value]));
      return keys.reduce(
        (acc, key) => {
          acc[key] = resultMap.get(key) ?? null;
          return acc;
        },
        {} as Record<string, string | null>
      );
    } catch {
      console.warn(
        'Failed to fetch settings, using defaults. DB might be unavailable during build.'
      );
      return keys.reduce(
        (acc, key) => {
          acc[key] = null;
          return acc;
        },
        {} as Record<string, string | null>
      );
    }
  }
);

// ============================================================================
// App Defaults
// ============================================================================

const DEFAULT_APP_NAME = 'Copilot';
const DEFAULT_APP_SUBTITLE = 'AI Chatbot';
const DEFAULT_APP_DESCRIPTION =
  'Copilot empowers you to inquire, receive immediate responses, and engage in dynamic conversations with AI. Offering access to GPT-4, gpt-3.5-turbo, Claude from Anthropic, and an array of other bots, Copilot provides a seamless and interactive experience for all your conversational needs.';

// ============================================================================
// High-level Service Functions
// ============================================================================

export const getAppSettings = cache(async () => {
  const values = await getSettings([
    'app.name',
    'app.subtitle',
    'app.description'
  ]);

  return {
    appName: values['app.name'] || DEFAULT_APP_NAME,
    appSubtitle: values['app.subtitle'] || DEFAULT_APP_SUBTITLE,
    appDescription: values['app.description'] || DEFAULT_APP_DESCRIPTION
  };
});

export async function getSystemSettings() {
  const [allModels, values] = await Promise.all([
    getAllModels(),
    getSettings([
      'app.name',
      'app.subtitle',
      'app.description',
      'speech.enabled',
      'default.chat.modelId',
      'default.image.modelId',
      'default.video.modelId',
      'default.tts.modelId',
      'default.speech.modelId',
      'default.speech.voice'
    ])
  ]);

  return {
    appName: values['app.name'] || DEFAULT_APP_NAME,
    appSubtitle: values['app.subtitle'] || DEFAULT_APP_SUBTITLE,
    appDescription: values['app.description'] || DEFAULT_APP_DESCRIPTION,
    speechEnabled: values['speech.enabled'] === 'true',
    chatModels: allModels.filter(m => m.capability === 'chat'),
    imageModels: allModels.filter(m => m.capability === 'image'),
    videoModels: allModels.filter(m => m.capability === 'video'),
    ttsModels: allModels.filter(m => m.capability === 'audio'),
    defaults: {
      chatModelId: values['default.chat.modelId'],
      imageModelId: values['default.image.modelId'],
      videoModelId: values['default.video.modelId'],
      ttsModelId: values['default.tts.modelId'],
      speechModelId: values['default.speech.modelId'],
      speechVoice: values['default.speech.voice']
    }
  };
}

// ============================================================================
// Quota Queries
// ============================================================================

/**
 * Resolve which quota row applies to a user, walking
 * override → plan → default → none. cache()-wrapped — preflight calls
 * `assertModelAccess` and `assertQuota` back-to-back; cache dedupes the
 * user/plan join to one DB round-trip.
 */
export const getUserResolvedQuota = cache(
  async (
    userId: string
  ): Promise<{
    quota: QuotaRow | null;
    plan: { id: string; name: string } | null;
    source: ResolvedSource;
  }> => {
    const userRow = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        quota: true,
        plan: { with: { quota: true } }
      }
    });

    const planInfo = userRow?.plan
      ? { id: userRow.plan.id, name: userRow.plan.name }
      : null;

    if (userRow?.quota) {
      return { quota: userRow.quota, plan: planInfo, source: 'override' };
    }

    if (userRow?.plan?.quota) {
      return { quota: userRow.plan.quota, plan: planInfo, source: 'plan' };
    }

    const defaultId = await getDefaultQuotaId();
    if (defaultId) {
      const defaultQuota = await db.query.quotas.findFirst({
        where: eq(quotas.id, defaultId)
      });
      if (defaultQuota) {
        return { quota: defaultQuota, plan: planInfo, source: 'default' };
      }
    }
    return { quota: null, plan: planInfo, source: 'none' };
  }
);

/**
 * Aggregate cost + reset time for a user's rolling 5h and 7d windows in a
 * single SQL. The reset time = earliest record in the window + window size
 * (when that record ages out, the rolling sum starts dropping).
 */
export async function getUserUsageWindows(userId: string): Promise<{
  fiveHour: { used: number; resetAt: Date | null };
  sevenDay: { used: number; resetAt: Date | null };
}> {
  const now = Date.now();
  const fiveHourSince = new Date(now - FIVE_HOUR_MS);
  const sevenDaySince = new Date(now - SEVEN_DAY_MS);

  const result = await db
    .select({
      sumFiveHour: sql<string>`coalesce(sum(${usage.cost}) filter (where ${usage.createdAt} >= ${fiveHourSince}), 0)`,
      sumSevenDay: sql<string>`coalesce(sum(${usage.cost}), 0)`,
      minFiveHour: sql<Date | null>`min(${usage.createdAt}) filter (where ${usage.createdAt} >= ${fiveHourSince})`,
      minSevenDay: sql<Date | null>`min(${usage.createdAt})`
    })
    .from(usage)
    .where(and(eq(usage.userId, userId), gte(usage.createdAt, sevenDaySince)));

  const r = result[0];
  return {
    fiveHour: {
      used: parseNumber(r?.sumFiveHour) ?? 0,
      resetAt: r?.minFiveHour
        ? new Date(new Date(r.minFiveHour).getTime() + FIVE_HOUR_MS)
        : null
    },
    sevenDay: {
      used: parseNumber(r?.sumSevenDay) ?? 0,
      resetAt: r?.minSevenDay
        ? new Date(new Date(r.minSevenDay).getTime() + SEVEN_DAY_MS)
        : null
    }
  };
}
