import { Voice } from '@/lib/types';

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
  readonly tts: {
    model?: string;
    voice?: Voice;
  };
  readonly availableModels: {
    openai: string[];
    google: string[];
    anthropic: string[];
  };
  readonly defaultModel?: string;
  readonly allowCustomAPIKey: boolean;
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
  tts: {
    model: process.env.TTS_MODEL,
    voice: process.env.TTS_VOICE as Voice
  },
  availableModels: {
    openai: process.env.OPENAI_MODELS?.split(',') || [],
    google: process.env.GOOGLE_GENERATIVE_AI_MODELS?.split(',') || [],
    anthropic: process.env.ANTHROPIC_MODELS?.split(',') || []
  },
  defaultModel: process.env.DEFAULT_MODEL,
  allowCustomAPIKey:
    process.env.ALLOW_CUSTOM_API_KEY === 'false' ? false : true,
  umami: {
    scriptURL: process.env.UMAMI_SCRIPT_URL,
    websiteId: process.env.UMAMI_WEBSITE_ID
  }
};
