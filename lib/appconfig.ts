import { APIProvider, Provider, Voice } from '@/lib/types';

export interface AppConfig {
  readonly product: {
    name: string;
    subtitle: string;
    description?: string;
    url?: string;
  };
  readonly db: {
    url: string;
    prefix: string;
  };
  readonly openai: {
    apiKey: string;
    baseURL?: string;
  };
  readonly google: {
    apiKey: string;
    baseURL?: string;
  };
  readonly anthropic: {
    apiKey: string;
    baseURL?: string;
  };
  readonly vertex: {
    project?: string;
    location?: string;
    credentials?: string;
  };
  readonly azure: {
    apiKey: string;
    baseURL?: string;
  };
  readonly xai: {
    apiKey: string;
    baseURL: string;
  };
  readonly tts: {
    enabled: boolean;
    model: string;
    voice: Voice;
  };
  readonly defaultModel: string;
  readonly availableModels: Record<Provider, string[]>;
  readonly generateTitleModels: Partial<Record<Provider, string>>;
  readonly apiCustomEnabled: boolean;
  readonly apiProvider: Partial<Record<Provider, { provider?: APIProvider }>>;
  readonly umami: {
    scriptURL?: string;
    websiteId?: string;
  };
}

export const appConfig: AppConfig = {
  product: {
    name: process.env.NEXT_PUBLIC_PRODUCT_NAME || 'Copilot',
    subtitle: process.env.NEXT_PUBLIC_PRODUCT_SUBTITLE || 'AI Chatbot',
    description: process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION,
    url: process.env.NEXT_PUBLIC_PRODUCT_URL
  },
  db: {
    url: process.env.POSTGRES_URL || '',
    prefix: process.env.DATABASE_PREFIX || ''
  },
  openai: {
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY || ''
  },
  google: {
    baseURL: process.env.GOOGLE_GENERATIVE_AI_BASE_URL,
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  },
  anthropic: {
    baseURL: process.env.ANTHROPIC_BASE_URL,
    apiKey: process.env.ANTHROPIC_API_KEY || ''
  },
  vertex: {
    project: process.env.GOOGLE_VERTEX_PROJECT,
    location: process.env.GOOGLE_VERTEX_LOCATION,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS
  },
  azure: {
    baseURL: process.env.AZURE_BASE_URL,
    apiKey: process.env.AZURE_API_KEY || ''
  },
  xai: {
    baseURL: process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
    apiKey: process.env.XAI_API_KEY || ''
  },
  tts: {
    enabled: process.env.TTS_ENABLED === 'true',
    model: process.env.TTS_MODEL || 'tts-1',
    voice: (process.env.TTS_VOICE || 'alloy') as Voice
  },
  defaultModel: process.env.DEFAULT_MODEL || 'gpt-4o',
  availableModels: {
    openai: process.env.OPENAI_MODELS?.split(',') || [],
    google: process.env.GOOGLE_MODELS?.split(',') || [],
    anthropic: process.env.ANTHROPIC_MODELS?.split(',') || [],
    xai: process.env.XAI_MODELS?.split(',') || []
  },
  generateTitleModels: {
    openai: process.env.OPENAI_GENERATE_TITLE_MODEL,
    google: process.env.GOOGLE_GENERATE_TITLE_MODEL,
    anthropic: process.env.ANTHROPIC_GENERATE_TITLE_MODEL
  },
  apiCustomEnabled:
    process.env.API_CUSTOM_ENABLED === 'false'
      ? false
      : process.env.API_CUSTOM_ENABLED === undefined
        ? true
        : true,
  apiProvider: {
    openai: process.env.OPENAI_API_PROVIDER
      ? {
          provider: process.env.OPENAI_API_PROVIDER as APIProvider
        }
      : undefined,
    google: process.env.GOOGLE_API_PROVIDER
      ? {
          provider: process.env.GOOGLE_API_PROVIDER as APIProvider
        }
      : undefined,
    anthropic: process.env.ANTHROPIC_API_PROVIDER
      ? {
          provider: process.env.ANTHROPIC_API_PROVIDER as APIProvider
        }
      : undefined
  },
  umami: {
    scriptURL: process.env.UMAMI_SCRIPT_URL,
    websiteId: process.env.UMAMI_WEBSITE_ID
  }
};
