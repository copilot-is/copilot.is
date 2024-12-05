import { APIProvider, Model, Provider, Voice } from '@/lib/types';

import { SupportedModels } from './constant';
import { ENV } from './env';

export interface AppConfig {
  readonly product: {
    name: string;
    subtitle: string;
    description?: string;
    url?: string;
  };
  readonly db: {
    provider?: string;
    url: string;
  };
  readonly openai: {
    enabled: boolean;
    apiKey?: string;
    baseURL?: string;
    provider?: APIProvider;
  };
  readonly google: {
    enabled: boolean;
    apiKey?: string;
    baseURL?: string;
    provider?: APIProvider;
  };
  readonly anthropic: {
    enabled: boolean;
    apiKey?: string;
    baseURL?: string;
    provider?: APIProvider;
  };
  readonly xai: {
    enabled: boolean;
    apiKey?: string;
    baseURL?: string;
  };
  readonly vertex: {
    project?: string;
    location?: string;
    credentials?: string;
  };
  readonly azure: {
    apiKey?: string;
    baseURL?: string;
  };
  readonly tts: {
    enabled: boolean;
    model: string;
    voice: Voice;
  };
  readonly defaultModel: string;
  readonly availableModels: Model[];
  readonly generateTitleModels: Partial<Record<Provider, string>>;
  readonly umami: {
    scriptURL?: string;
    websiteId?: string;
  };
}

export const appConfig: AppConfig = {
  product: {
    name: ENV.NEXT_PUBLIC_PRODUCT_NAME,
    subtitle: ENV.NEXT_PUBLIC_PRODUCT_SUBTITLE,
    description: ENV.NEXT_PUBLIC_PRODUCT_DESCRIPTION,
    url: ENV.NEXT_PUBLIC_PRODUCT_URL
  },
  db: {
    provider: ENV.DATABASE_PROVIDER,
    url: ENV.POSTGRES_URL
  },
  defaultModel: ENV.DEFAULT_MODEL,
  openai: {
    enabled: ENV.OPENAI_ENABLED === 'true',
    baseURL: ENV.OPENAI_BASE_URL,
    apiKey: ENV.OPENAI_API_KEY,
    provider: ENV.OPENAI_API_PROVIDER as APIProvider
  },
  google: {
    enabled: ENV.GOOGLE_ENABLED === 'true',
    baseURL: ENV.GOOGLE_GENERATIVE_AI_BASE_URL,
    apiKey: ENV.GOOGLE_GENERATIVE_AI_API_KEY,
    provider: ENV.GOOGLE_API_PROVIDER as APIProvider
  },
  anthropic: {
    enabled: ENV.ANTHROPIC_ENABLED === 'true',
    baseURL: ENV.ANTHROPIC_BASE_URL,
    apiKey: ENV.ANTHROPIC_API_KEY,
    provider: ENV.ANTHROPIC_API_PROVIDER as APIProvider
  },
  xai: {
    enabled: ENV.XAI_ENABLED === 'true',
    baseURL: ENV.XAI_BASE_URL,
    apiKey: ENV.XAI_API_KEY
  },
  vertex: {
    project: ENV.GOOGLE_VERTEX_PROJECT,
    location: ENV.GOOGLE_VERTEX_LOCATION,
    credentials: ENV.GOOGLE_APPLICATION_CREDENTIALS
  },
  azure: {
    baseURL: ENV.AZURE_BASE_URL,
    apiKey: ENV.AZURE_API_KEY
  },
  tts: {
    enabled: ENV.OPENAI_ENABLED === 'true' && ENV.TTS_ENABLED === 'true',
    model: ENV.TTS_MODEL,
    voice: ENV.TTS_VOICE as Voice
  },
  availableModels: [
    ...(ENV.OPENAI_ENABLED === 'true'
      ? SupportedModels.filter(model =>
          ENV.OPENAI_MODELS
            ? ENV.OPENAI_MODELS.split(',').includes(model.value)
            : model.provider === 'openai'
        )
      : []),
    ...(ENV.GOOGLE_ENABLED === 'true'
      ? SupportedModels.filter(model =>
          ENV.GOOGLE_MODELS
            ? ENV.GOOGLE_MODELS.split(',').includes(model.value)
            : model.provider === 'google'
        )
      : []),
    ...(ENV.ANTHROPIC_ENABLED === 'true'
      ? SupportedModels.filter(model =>
          ENV.ANTHROPIC_MODELS
            ? ENV.ANTHROPIC_MODELS.split(',').includes(model.value)
            : model.provider === 'anthropic'
        )
      : []),
    ...(ENV.XAI_ENABLED === 'true'
      ? SupportedModels.filter(model =>
          ENV.XAI_MODELS
            ? ENV.XAI_MODELS.split(',').includes(model.value)
            : model.provider === 'xai'
        )
      : [])
  ],
  generateTitleModels: {
    openai: ENV.OPENAI_GENERATE_TITLE_MODEL,
    google: ENV.GOOGLE_GENERATE_TITLE_MODEL,
    anthropic: ENV.ANTHROPIC_GENERATE_TITLE_MODEL
  },
  umami: {
    scriptURL: ENV.UMAMI_SCRIPT_URL,
    websiteId: ENV.UMAMI_WEBSITE_ID
  }
};
