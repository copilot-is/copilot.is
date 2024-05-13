import { type Model, ModelProvider, ChatCategory } from '@/lib/types'

// https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web/blob/main/app/constant.ts#L125
export const KnowledgeCutOffDate: Record<string, string> = {
  default: '2021-09',
  'gpt-4-turbo': '2023-12',
  'gpt-4-turbo-2024-04-09': '2023-12',
  'gpt-4-turbo-preview': '2023-12',
  'gpt-4-vision-preview': '2023-04',
  // After improvements,
  // it's now easier to add "KnowledgeCutOffDate" instead of stupid hardcoding it, as was done previously.
  'gemini-pro': '2023-12',
  'gemini-pro-vision': '2023-12'
}

export const SupportedModels: {
  text: string
  value: Model
  image?: boolean
  vision?: boolean
  provider: ModelProvider
}[] = [
  {
    text: 'GPT-4 Turbo',
    value: 'gpt-4-turbo',
    provider: 'openai'
  },
  {
    text: 'GPT-4 2024-04-09',
    value: 'gpt-4-turbo-2024-04-09',
    provider: 'openai'
  },
  {
    text: 'GPT-4 0125',
    value: 'gpt-4-0125-preview',
    provider: 'openai'
  },
  {
    text: 'GPT-4 Turbo Preview',
    value: 'gpt-4-turbo-preview',
    provider: 'openai'
  },
  {
    text: 'GPT-4 1106 Preview',
    value: 'gpt-4-1106-preview',
    provider: 'openai'
  },
  {
    text: 'GPT-4 Vision',
    value: 'gpt-4-vision-preview',
    vision: true,
    provider: 'openai'
  },
  { text: 'GPT-4', value: 'gpt-4', provider: 'openai' },
  { text: 'GPT-4 0314', value: 'gpt-4-0314', provider: 'openai' },
  { text: 'GPT-4 0613', value: 'gpt-4-0613', provider: 'openai' },
  { text: 'GPT-4 32k', value: 'gpt-4-32k', provider: 'openai' },
  { text: 'GPT-4 32k 0314', value: 'gpt-4-32k-0314', provider: 'openai' },
  { text: 'GPT-4 32k 0613', value: 'gpt-4-32k-0613', provider: 'openai' },
  { text: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', provider: 'openai' },
  { text: 'GPT-3.5 Turbo 16k', value: 'gpt-3.5-turbo-16k', provider: 'openai' },
  {
    text: 'GPT-3.5 Turbo 0301',
    value: 'gpt-3.5-turbo-0301',
    provider: 'openai'
  },
  {
    text: 'GPT-3.5 Turbo 0613',
    value: 'gpt-3.5-turbo-0613',
    provider: 'openai'
  },
  {
    text: 'GPT-3.5 Turbo 1106',
    value: 'gpt-3.5-turbo-1106',
    provider: 'openai'
  },
  {
    text: 'GPT-3.5 Turbo 0125',
    value: 'gpt-3.5-turbo-0125',
    provider: 'openai'
  },
  {
    text: 'GPT-3.5 Turbo 16k 0613',
    value: 'gpt-3.5-turbo-16k-0613',
    provider: 'openai'
  },
  {
    text: 'DALL·E 3',
    value: 'dall-e-3',
    image: true,
    provider: 'openai'
  },
  {
    text: 'Gemini 1.5 Pro',
    value: 'gemini-1.5-pro-latest',
    vision: true,
    provider: 'google'
  },
  { text: 'Gemini 1 Pro', value: 'gemini-pro', provider: 'google' },
  {
    text: 'Gemini 1 Pro Vision',
    value: 'gemini-pro-vision',
    vision: true,
    provider: 'google'
  },
  {
    text: 'Claude 3 Opus',
    value: 'claude-3-opus-20240229',
    vision: true,
    provider: 'anthropic'
  },
  {
    text: 'Claude 3 Sonnet',
    value: 'claude-3-sonnet-20240229',
    vision: true,
    provider: 'anthropic'
  },
  {
    text: 'Claude 3 Haiku',
    value: 'claude-3-haiku-20240307',
    vision: true,
    provider: 'anthropic'
  },
  { text: 'Claude 2.1', value: 'claude-2.1', provider: 'anthropic' },
  { text: 'Claude 2', value: 'claude-2.0', provider: 'anthropic' },
  {
    text: 'Claude Instant 1.2',
    value: 'claude-instant-1.2',
    provider: 'anthropic'
  }
]

export enum ServiceProvider {
  openai = 'OpenAI',
  google = 'Google',
  anthropic = 'Anthropic'
}

export const SystemPrompt = `
You are ChatGPT, a large language model trained by {provider}.
Knowledge cutoff: {cutoff}
Current model: {model}
Current time: {time}
Latex inline: \\(x^2\\)
Latex block: $$e=mc^2$$
`

export const GenerateTitlePrompt =
  'Please generate a four to five word title summarizing our conversation without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks.'

export const ChatCategories: ChatCategory[] = [
  'Today',
  'Yesterday',
  'Previous 7 Days',
  'Previous Month',
  'Older'
]
