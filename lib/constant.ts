import { type Model, ModelProvider, ChatCategory } from '@/lib/types'

export const SupportedModels: {
  text: string
  value: Model
  vision?: boolean
  provider: ModelProvider
}[] = [
  //OPENAI
  {
    text: 'GPT-4 Turbo',
    value: 'gpt-4-turbo-2024-04-09',
    provider: 'openai'
  },
  {
    text: 'GPT-4', //lowcost
    value: 'gpt-4',
    provider: 'openai'
  },
  {
    text: 'GPT-4 Vision',
    value: 'gpt-4-vision-preview',
    vision: true,
    provider: 'openai'
  },
  {
    text: 'GPT-3.5',
    value: 'gpt-3.5-turbo-16k',
    provider: 'openai',
  },
  //GOOGLE
  {
    text: 'Gemini 1.5 Pro',
    value: 'gemini-1.5-pro',
    vision: true,
    provider: 'google'
  },
  { text: 'Gemini 1 Pro',
    value: 'gemini-1.0-pro', 
    provider: 'google' 
  },
  //CLAUDE
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

  //OLD-MODEL
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  { text: 'Claude 2.1', value: 'claude-2.1', provider: 'anthropic' },
  { text: 'Claude 2', value: 'claude-2.0', provider: 'anthropic' },
  {
    text: 'Claude Instant 1.2',
    value: 'claude-instant-1.2',
    provider: 'anthropic'
  },
  {
    text: 'Gemini 1 Pro Vision',
    value: 'gemini-pro-vision',
    vision: true,
    provider: 'google'
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
  { text: 'GPT-4 0314', value: 'gpt-4-0314', provider: 'openai' },
  { text: 'GPT-4 0613', value: 'gpt-4-0613', provider: 'openai' },
  { text: 'GPT-4 32k', value: 'gpt-4-32k', provider: 'openai' },
  { text: 'GPT-4 32k 0314', value: 'gpt-4-32k-0314', provider: 'openai' },
  { text: 'GPT-4 32k 0613', value: 'gpt-4-32k-0613', provider: 'openai' },
  { text: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', provider: 'openai' },
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
    text: 'GPT-4 0125',
    value: 'gpt-4-0125-preview',
    provider: 'openai'
  },
  {
    text: 'GPT-4 1106',
    value: 'gpt-4-1106-preview',
    provider: 'openai'
  },
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
]

export const GenerateTitlePrompt = 'Generate a concise title using only the key word from the conversation without quotation marks';

export const ChatCategories: ChatCategory[] = [
  'Today',
  'Yesterday',
  'Previous 7 Days',
  'Previous Month',
  'Older'
]