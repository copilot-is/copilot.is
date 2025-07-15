import { ChatModelSettings, Model, Provider, Voice } from '@/types';

export const ChatModels: Model[] = [
  {
    text: 'OpenAI o3 mini',
    value: 'o3-mini',
    reasoning: true,
    provider: 'openai'
  },
  {
    text: 'OpenAI o1',
    value: 'o1',
    alias: ['o1-preview'],
    vision: true,
    reasoning: true,
    provider: 'openai'
  },
  {
    text: 'OpenAI o1 mini',
    value: 'o1-mini',
    reasoning: true,
    provider: 'openai'
  },
  {
    text: 'GPT-4.5 Preview',
    value: 'gpt-4.5-preview',
    vision: true,
    provider: 'openai'
  },
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
    text: 'GPT-4 Turbo',
    value: 'gpt-4-turbo',
    vision: true,
    provider: 'openai'
  },
  { text: 'GPT-4', value: 'gpt-4', provider: 'openai' },
  { text: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', provider: 'openai' },
  {
    text: 'Gemini 2.0 Flash',
    value: 'gemini-2.0-flash',
    alias: ['gemini-2.0-flash-exp'],
    vision: true,
    provider: 'google'
  },
  {
    text: 'Gemini 2.0 Flash Lite',
    value: 'gemini-2.0-flash-lite',
    vision: true,
    provider: 'google'
  },
  {
    text: 'Gemini 1.5 Pro',
    value: 'gemini-1.5-pro',
    vision: true,
    provider: 'google'
  },
  {
    text: 'Gemini 1.5 Flash',
    value: 'gemini-1.5-flash',
    vision: true,
    provider: 'google'
  },
  {
    text: 'Gemini 1.5 Flash-8B',
    value: 'gemini-1.5-flash-8b',
    vision: true,
    provider: 'google'
  },
  {
    text: 'Claude 3.7 Sonnet',
    value: 'claude-3-7-sonnet-20250219',
    vision: true,
    reasoning: true,
    provider: 'anthropic'
  },
  {
    text: 'Claude 3.5 Sonnet',
    value: 'claude-3-5-sonnet-20241022',
    alias: ['claude-3-5-sonnet-20240620'],
    vision: true,
    provider: 'anthropic'
  },
  {
    text: 'Claude 3.5 Haiku',
    value: 'claude-3-5-haiku-20241022',
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
  {
    text: 'Grok 4',
    value: 'grok-4',
    alias: ['grok-4-0709'],
    vision: true,
    reasoning: true,
    provider: 'xai'
  },
  {
    text: 'Grok 3',
    value: 'grok-3',
    provider: 'xai'
  },
  {
    text: 'Grok 3 fast',
    value: 'grok-3-fast',
    provider: 'xai'
  },
  {
    text: 'Grok 3 mini',
    value: 'grok-3-mini',
    reasoning: true,
    provider: 'xai'
  },
  {
    text: 'Grok 3 mini fast',
    value: 'grok-3-mini-fast',
    reasoning: true,
    provider: 'xai'
  },
  {
    text: 'Grok 2',
    value: 'grok-2',
    alias: ['grok-2-1212', 'grok-2-latest'],
    provider: 'xai'
  },
  {
    text: 'Grok 2 Vision',
    value: 'grok-2-vision',
    alias: ['grok-2-vision-1212', 'grok-2-vision-latest'],
    vision: true,
    provider: 'xai'
  },
  {
    text: 'DeepSeek',
    value: 'deepseek-chat',
    provider: 'deepseek'
  },
  {
    text: 'DeepSeek R1',
    value: 'deepseek-reasoner',
    reasoning: true,
    provider: 'deepseek'
  }
];

export const ImageModels: Model[] = [
  {
    text: 'DALL·E 3',
    value: 'dall-e-3',
    provider: 'openai'
  },
  {
    text: 'DALL·E 2',
    value: 'dall-e-2',
    provider: 'openai'
  },
  { text: 'Grok 2 Image', value: 'grok-2-image', provider: 'xai' }
];

export const TTSModels: Model[] = [
  {
    text: 'OpenAI TTS',
    value: 'tts-1',
    provider: 'openai'
  },
  {
    text: 'OpenAI TTS HD',
    value: 'tts-1-hd',
    provider: 'openai'
  }
];

export const Voices: Voice[] = [
  'alloy',
  'ash',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer'
];

export const ServiceProvider: Record<Provider, string> = {
  openai: 'OpenAI',
  google: 'Google',
  anthropic: 'Anthropic',
  xai: 'xAI',
  deepseek: 'DeepSeek'
};

export const SystemPrompt = `A large language model trained by {provider}.
Current model: {model}
Current time: {time}
Latex inline: \\(x^2\\)
Latex block: $$e=mc^2$$`;

export const GenerateTitlePrompt = `\n
- you will generate a short title based on the first message a user begins a conversation with
- ensure it is not more than 80 characters long
- the title should be a summary of the user's message
- do not use quotes or colons`;

export const Categories: { text: string; value: string }[] = [
  { text: 'Today', value: 'today' },
  { text: 'Yesterday', value: 'yesterday' },
  { text: 'Previous 7 Days', value: 'lastWeek' },
  { text: 'Previous 30 Days', value: 'lastMonth' },
  { text: 'Older', value: 'older' }
];

export const VertexAIModels: Record<string, string> = {
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-v2@20241022',
  'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet@20240620',
  'claude-3-opus-20240229': 'claude-3-opus@20240229',
  'claude-3-sonnet-20240229': 'claude-3-sonnet@20240229',
  'claude-3-haiku-20240307': 'claude-3-haiku@20240307'
};
