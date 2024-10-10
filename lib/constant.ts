import { ChatCategory, type ModelProfile } from '@/lib/types';

export const SupportedModels: ModelProfile[] = [
  {
    text: 'GPT-4o',
    value: 'gpt-4o',
    vision: true,
    provider: 'openai'
  },
  {
    text: 'GPT-4o mini',
    value: 'gpt-4o-mini',
    vision: true,
    provider: 'openai'
  },
  {
    text: 'OpenAI o1 preview',
    value: 'o1-preview',
    vision: false,
    provider: 'openai'
  },
  {
    text: 'OpenAI o1 mini',
    value: 'o1-mini',
    vision: false,
    provider: 'openai'
  },
  {
    text: 'GPT-4 Turbo',
    value: 'gpt-4-turbo',
    vision: true,
    provider: 'openai'
  },
  { text: 'GPT-4', value: 'gpt-4', provider: 'openai' },
  { text: 'GPT-4 32k', value: 'gpt-4-32k', provider: 'openai' },
  { text: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', provider: 'openai' },
  { text: 'GPT-3.5 Turbo 16k', value: 'gpt-3.5-turbo-16k', provider: 'openai' },
  {
    text: 'DALL·E 3',
    value: 'dall-e-3',
    provider: 'openai',
    api: '/api/images/openai'
  },
  {
    text: 'Gemini 1.5 Flash',
    value: 'gemini-1.5-flash-latest',
    vision: true,
    provider: 'google'
  },
  {
    text: 'Gemini 1.5 Pro',
    value: 'gemini-1.5-pro-latest',
    vision: true,
    provider: 'google'
  },
  {
    text: 'Claude 3.5 Sonnet',
    value: 'claude-3-5-sonnet-20240620',
    vision: true,
    provider: 'anthropic'
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
];

export enum ServiceProvider {
  openai = 'OpenAI',
  google = 'Google',
  vertex = 'Google Vertex',
  anthropic = 'Anthropic'
}

export const SystemPrompt = `A large language model trained by {provider}.
Current model: {model}
Current time: {time}
Latex inline: \\(x^2\\)
Latex block: $$e=mc^2$$`;

export const GenerateTitlePrompt =
  'Please generate a four to five word title summarizing our conversation without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks.';

export const ChatCategories: ChatCategory[] = [
  'Today',
  'Yesterday',
  'Previous 7 Days',
  'Previous Month',
  'Older'
];
