import { ChatCategory, Voice, type Model, type Settings } from '@/lib/types';

export const SupportedModels: Model[] = [
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
    type: 'images'
  },
  {
    text: 'Gemini 2.0 Flash',
    value: 'gemini-2.0-flash-exp',
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
    text: 'Claude 3.5 Sonnet (New)',
    value: 'claude-3-5-sonnet-20241022',
    vision: true,
    provider: 'anthropic'
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
  {
    text: 'Grok 2',
    value: 'grok-2-1212',
    provider: 'xai'
  },
  {
    text: 'Grok 2 Vision',
    value: 'grok-2-vision-1212',
    vision: true,
    provider: 'xai'
  },
  {
    text: 'Grok beta',
    value: 'grok-beta',
    provider: 'xai'
  },
  {
    text: 'Grok Vision beta',
    value: 'grok-vision-beta',
    vision: true,
    provider: 'xai'
  },
  {
    text: 'DeepSeek Chat',
    value: 'deepseek-chat',
    provider: 'deepseek'
  },
  {
    text: 'DeepSeek Coder',
    value: 'deepseek-coder',
    provider: 'deepseek'
  }
];

export const TTSModels: Model[] = [
  {
    text: 'OpenAI TTS',
    value: 'tts-1',
    provider: 'openai',
    type: 'audio'
  },
  {
    text: 'OpenAI TTS HD',
    value: 'tts-1-hd',
    provider: 'openai',
    type: 'audio'
  }
];

export const Voices: Voice[] = [
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer'
];

export enum ServiceProvider {
  openai = 'OpenAI',
  google = 'Google',
  anthropic = 'Anthropic',
  xai = 'xAI',
  deepseek = 'DeepSeek'
}

export const SystemPrompt = `A large language model trained by {provider}.
Current model: {model}
Current time: {time}
Latex inline: \\(x^2\\)
Latex block: $$e=mc^2$$`;

export const GenerateTitlePrompt =
  'Please generate a four to five word title summarizing our conversation without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks.';

export const DefaultSettings: Settings = {
  prompt: SystemPrompt,
  temperature: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: 4096
};

export const ChatCategories: ChatCategory[] = [
  'Today',
  'Yesterday',
  'Previous 7 Days',
  'Previous Month',
  'Older'
];

export const VertexAIModels: Record<string, string> = {
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-v2@20241022',
  'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet@20240620',
  'claude-3-opus-20240229': 'claude-3-opus@20240229',
  'claude-3-sonnet-20240229': 'claude-3-sonnet@20240229',
  'claude-3-haiku-20240307': 'claude-3-haiku@20240307'
};
