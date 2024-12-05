import { z } from 'zod';

const envSchema = z.object({
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

  // Product
  NEXT_PUBLIC_PRODUCT_NAME: z.string().default('Copilot'),
  NEXT_PUBLIC_PRODUCT_SUBTITLE: z.string().default('AI Chatbot'),
  NEXT_PUBLIC_PRODUCT_DESCRIPTION: z.string().optional(),
  NEXT_PUBLIC_PRODUCT_URL: z.string().optional(),

  // Database
  DATABASE_PROVIDER: z
    .string()
    .optional()
    .refine(
      val => !val || val === 'neon',
      'DATABASE_PROVIDER must be either empty or "neon"'
    ),
  POSTGRES_URL: z
    .string()
    .refine(
      url => url.startsWith('postgres://') || url.startsWith('postgresql://'),
      'POSTGRES_URL must start with postgres:// or postgresql://'
    ),

  // Auth
  AUTH_SECRET: z.string(),

  // GitHub Auth
  AUTH_GITHUB_ENABLED: z.string().default('true'),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  // Google Auth
  AUTH_GOOGLE_ENABLED: z.string().default('true'),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // OpenAI
  OPENAI_ENABLED: z.string().default('true'),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_API_PROVIDER: z.string().optional(),
  OPENAI_MODELS: z.string().optional(),
  OPENAI_GENERATE_TITLE_MODEL: z.string().optional(),

  // Azure
  AZURE_BASE_URL: z.string().optional(),
  AZURE_API_KEY: z.string().optional(),

  // Google
  GOOGLE_ENABLED: z.string().default('true'),
  GOOGLE_GENERATIVE_AI_BASE_URL: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GOOGLE_API_PROVIDER: z.string().optional(),
  GOOGLE_MODELS: z.string().optional(),
  GOOGLE_GENERATE_TITLE_MODEL: z.string().optional(),

  // Google Vertex
  GOOGLE_VERTEX_PROJECT: z.string().optional(),
  GOOGLE_VERTEX_LOCATION: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  // Anthropic
  ANTHROPIC_ENABLED: z.string().default('true'),
  ANTHROPIC_BASE_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_API_PROVIDER: z.string().optional(),
  ANTHROPIC_MODELS: z.string().optional(),
  ANTHROPIC_GENERATE_TITLE_MODEL: z.string().optional(),

  // xAI
  XAI_ENABLED: z.string().default('true'),
  XAI_BASE_URL: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  XAI_MODELS: z.string().optional(),
  XAI_GENERATE_TITLE_MODEL: z.string().optional(),

  // TTS
  TTS_ENABLED: z.string().default('true'),
  TTS_MODEL: z.string().default('tts-1'),
  TTS_VOICE: z.string().default('alloy'),

  // Model
  DEFAULT_MODEL: z.string().default('gpt-4'),

  // Analytics
  UMAMI_SCRIPT_URL: z.string().optional(),
  UMAMI_WEBSITE_ID: z.string().optional()
});

type ENV = z.infer<typeof envSchema>;

export const ENV: ENV = envSchema.parse(process.env);
