import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z
      .string()
      .optional()
      .refine(
        port => !port || (parseInt(port) > 0 && parseInt(port) < 65536),
        'Invalid port number'
      ),
    VERCEL_URL: z.string().optional(),

    // Database
    POSTGRES_URL: z
      .string()
      .refine(
        url => url.startsWith('postgres://') || url.startsWith('postgresql://'),
        'POSTGRES_URL must start with postgres:// or postgresql://'
      ),

    // Auth
    AUTH_SECRET: z.string(),

    // GitHub Auth
    AUTH_GITHUB_ENABLED: z.string().default('false'),
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),

    // Google Auth
    AUTH_GOOGLE_ENABLED: z.string().default('false'),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),

    // OpenAI
    OPENAI_ENABLED: z.string().default('false'),
    OPENAI_BASE_URL: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_API_PROVIDER: z.enum(['azure']).optional(),
    OPENAI_MODELS: z.string().optional(),
    OPENAI_GENERATE_TITLE_MODEL: z.string().optional(),

    // Azure
    AZURE_BASE_URL: z.string().optional(),
    AZURE_API_KEY: z.string().optional(),

    // Google
    GOOGLE_ENABLED: z.string().default('false'),
    GOOGLE_GENERATIVE_AI_BASE_URL: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    GOOGLE_API_PROVIDER: z.enum(['vertex']).optional(),
    GOOGLE_MODELS: z.string().optional(),
    GOOGLE_GENERATE_TITLE_MODEL: z.string().optional(),

    // Google Vertex
    GOOGLE_VERTEX_PROJECT: z.string().optional(),
    GOOGLE_VERTEX_LOCATION: z.string().optional(),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

    // Anthropic
    ANTHROPIC_ENABLED: z.string().default('false'),
    ANTHROPIC_BASE_URL: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_API_PROVIDER: z.enum(['vertex']).optional(),
    ANTHROPIC_MODELS: z.string().optional(),
    ANTHROPIC_GENERATE_TITLE_MODEL: z.string().optional(),

    // xAI
    XAI_ENABLED: z.string().default('false'),
    XAI_BASE_URL: z.string().optional(),
    XAI_API_KEY: z.string().optional(),
    XAI_MODELS: z.string().optional(),
    XAI_GENERATE_TITLE_MODEL: z.string().optional(),

    // TTS
    TTS_ENABLED: z.string().default('false'),
    TTS_MODEL: z.enum(['tts-1', 'tts-1-hd']).default('tts-1'),
    TTS_VOICE: z
      .enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
      .default('alloy'),

    // Default Model
    DEFAULT_MODEL: z.string().default('gpt-4'),

    // Analytics
    UMAMI_SCRIPT_URL: z.string().optional(),
    UMAMI_WEBSITE_ID: z.string().optional()
  },
  client: {
    NEXT_PUBLIC_PRODUCT_NAME: z.string().default('Copilot'),
    NEXT_PUBLIC_PRODUCT_SUBTITLE: z.string().default('AI Chatbot'),
    NEXT_PUBLIC_PRODUCT_DESCRIPTION: z.string().optional()
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    VERCEL_URL: process.env.VERCEL_URL,

    // Database
    POSTGRES_URL: process.env.POSTGRES_URL,

    // Auth
    AUTH_SECRET: process.env.AUTH_SECRET,

    // GitHub Auth
    AUTH_GITHUB_ENABLED: process.env.AUTH_GITHUB_ENABLED,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,

    // Google Auth
    AUTH_GOOGLE_ENABLED: process.env.AUTH_GOOGLE_ENABLED,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,

    // OpenAI
    OPENAI_ENABLED: process.env.OPENAI_ENABLED,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_API_PROVIDER: process.env.OPENAI_API_PROVIDER,
    OPENAI_MODELS: process.env.OPENAI_MODELS,
    OPENAI_GENERATE_TITLE_MODEL: process.env.OPENAI_GENERATE_TITLE_MODEL,

    // Azure
    AZURE_BASE_URL: process.env.AZURE_BASE_URL,
    AZURE_API_KEY: process.env.AZURE_API_KEY,

    // Google
    GOOGLE_ENABLED: process.env.GOOGLE_ENABLED,
    GOOGLE_GENERATIVE_AI_BASE_URL: process.env.GOOGLE_GENERATIVE_AI_BASE_URL,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GOOGLE_API_PROVIDER: process.env.GOOGLE_API_PROVIDER,
    GOOGLE_MODELS: process.env.GOOGLE_MODELS,
    GOOGLE_GENERATE_TITLE_MODEL: process.env.GOOGLE_GENERATE_TITLE_MODEL,

    // Google Vertex
    GOOGLE_VERTEX_PROJECT: process.env.GOOGLE_VERTEX_PROJECT,
    GOOGLE_VERTEX_LOCATION: process.env.GOOGLE_VERTEX_LOCATION,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,

    // Anthropic
    ANTHROPIC_ENABLED: process.env.ANTHROPIC_ENABLED,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_API_PROVIDER: process.env.ANTHROPIC_API_PROVIDER,
    ANTHROPIC_MODELS: process.env.ANTHROPIC_MODELS,
    ANTHROPIC_GENERATE_TITLE_MODEL: process.env.ANTHROPIC_GENERATE_TITLE_MODEL,

    // xAI
    XAI_ENABLED: process.env.XAI_ENABLED,
    XAI_BASE_URL: process.env.XAI_BASE_URL,
    XAI_API_KEY: process.env.XAI_API_KEY,
    XAI_MODELS: process.env.XAI_MODELS,
    XAI_GENERATE_TITLE_MODEL: process.env.XAI_GENERATE_TITLE_MODEL,

    // TTS
    TTS_ENABLED: process.env.TTS_ENABLED,
    TTS_MODEL: process.env.TTS_MODEL,
    TTS_VOICE: process.env.TTS_VOICE,

    // Default Model
    DEFAULT_MODEL: process.env.DEFAULT_MODEL,

    // Client-side
    NEXT_PUBLIC_PRODUCT_NAME: process.env.NEXT_PUBLIC_PRODUCT_NAME,
    NEXT_PUBLIC_PRODUCT_SUBTITLE: process.env.NEXT_PUBLIC_PRODUCT_SUBTITLE,
    NEXT_PUBLIC_PRODUCT_DESCRIPTION:
      process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION,
    // Analytics
    UMAMI_SCRIPT_URL: process.env.UMAMI_SCRIPT_URL,
    UMAMI_WEBSITE_ID: process.env.UMAMI_WEBSITE_ID
  }
});
