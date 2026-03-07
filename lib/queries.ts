import 'server-only';

import { cache } from 'react';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@/server/db';
import { models, prompts, providers, settings } from '@/server/db/schema';

// ============================================================================
// Types
// ============================================================================

type Provider = typeof providers.$inferSelect;
type Model = typeof models.$inferSelect & {
  provider: Provider | null;
};

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

const getPromptById = cache(async (id: string): Promise<string | null> => {
  const result = await db.select().from(prompts).where(eq(prompts.id, id));
  return result[0]?.content ?? null;
});

// ============================================================================
// Settings Queries
// ============================================================================

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
  const values = await getSettings(['title.prompt', 'title.model']);
  const promptId = values['title.prompt'];
  const modelId = values['title.model'];

  const model = modelId ? await findModelByModelId(modelId) : undefined;
  const prompt = promptId ? await getPromptById(promptId) : null;

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
      const content = await getPromptById(promptId);
      if (content) return content;
    }
    const values = await getSettings(['default.chat.systemPrompt']);
    const defaultPromptId = values['default.chat.systemPrompt'];
    if (!defaultPromptId) return null;
    return getPromptById(defaultPromptId);
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
    } catch (error) {
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
