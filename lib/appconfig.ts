export interface AppConfig {
  readonly product: {
    name: string
    subtitle: string
    description?: string
    url?: string
  }
  readonly db: {
    url: string
    prefix: string
  }
  readonly openai: {
    apiKey: string
    baseURL?: string
    models?: string
  }
  readonly google: {
    apiKey: string
    baseURL?: string
    models?: string
  }
  readonly anthropic: {
    apiKey: string
    baseURL?: string
    models?: string
  }
  readonly defaultModel?: string
  readonly allowCustomAPIKey: boolean
  readonly umami: {
    scriptURL?: string
    websiteId?: string
  }
}

export const appConfig: AppConfig = {
  product: {
    name: process.env.PRODUCT_NAME || 'Copilot',
    subtitle: process.env.PRODUCT_SUBTITLE || 'AI Chatbot',
    description: process.env.PRODUCT_DESCRIPTION,
    url: process.env.PRODUCT_URL
  },
  db: {
    url: process.env.POSTGRES_URL || '',
    prefix: process.env.DATABASE_PREFIX || ''
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_BASE_URL,
    models: process.env.OPENAI_MODELS
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY || '',
    models: process.env.GOOGLE_MODELS
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    baseURL: process.env.ANTHROPIC_BASE_URL,
    models: process.env.ANTHROPIC_MODELS
  },
  defaultModel: process.env.DEFAULT_MODEL,
  allowCustomAPIKey:
    process.env.ALLOW_CUSTOM_API_KEY === 'false' ? false : true,
  umami: {
    scriptURL: process.env.UMAMI_SCRIPT_URL,
    websiteId: process.env.UMAMI_WEBSITE_ID
  }
}
