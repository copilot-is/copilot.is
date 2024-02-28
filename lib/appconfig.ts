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
    apiUrl?: string
  }
  readonly google: {
    apiKey: string
    apiUrl?: string
  }
  readonly defaultModel?: string
  readonly supportedModels?: string[]
  readonly allowCustomAPIKey: boolean
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
    apiUrl: process.env.OPENAI_API_URL
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY || ''
  },
  defaultModel: process.env.DEFAULT_MODEL,
  supportedModels: process.env.SUPPORTED_MODELS?.split(','),
  allowCustomAPIKey: process.env.ALLOW_CUSTOM_API_KEY === 'false' ? false : true
}
