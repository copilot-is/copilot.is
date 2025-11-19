import { Model, Provider, Voice } from '@/types';

export const ChatModels: Model[] = [
  {
    text: 'GPT-5.1 Thinking',
    value: 'gpt-5.1-thinking-2025-11-12',
    reasoning: true,
    provider: 'openai'
  },
  {
    text: 'GPT-5.1 Instant',
    value: 'gpt-5.1-instant-2025-11-12',
    provider: 'openai'
  },
  {
    text: 'GPT-5',
    value: 'gpt-5',
    reasoning: true,
    provider: 'openai'
  },
  {
    text: 'GPT-5 Mini',
    value: 'gpt-5-mini',
    provider: 'openai'
  },
  {
    text: 'GPT-5 Nano',
    value: 'gpt-5-nano',
    provider: 'openai'
  },
  {
    text: 'OpenAI o3',
    value: 'o3',
    reasoning: true,
    provider: 'openai'
  },
  {
    text: 'OpenAI o3 Pro',
    value: 'o3-pro',
    reasoning: true,
    provider: 'openai'
  },
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
  { text: 'GPT-4', value: 'gpt-4', provider: 'openai', deprecated: true },
  { text: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', provider: 'openai', deprecated: true },
  {
    text: 'Gemini 3 Pro',
    value: 'gemini-3-pro-preview',
    vision: true,
    provider: 'google'
  },
  {
    text: 'Gemini 2.0 Pro',
    value: 'gemini-2.0-pro-exp-02-05',
    vision: true,
    provider: 'google'
  },
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
    text: 'Gemini 2.5 Flash Image',
    value: 'gemini-2.5-flash-image-preview',
    vision: true,
    provider: 'google'
  },
  {
    text: 'Claude 4.5 Sonnet',
    value: 'claude-sonnet-4-5-20250929',
    vision: true,
    provider: 'anthropic'
  },
  {
    text: 'Claude 4.5 Haiku',
    value: 'claude-haiku-4-5',
    vision: true,
    provider: 'anthropic'
  },
  {
    text: 'Claude 3.7 Sonnet',
    value: 'claude-3-7-sonnet-20250219',
    vision: true,
    reasoning: true,
    provider: 'anthropic',
    options: {
      isReasoning: true
    }
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
    provider: 'anthropic',
    deprecated: true
  },
  {
    text: 'Claude 3 Sonnet',
    value: 'claude-3-sonnet-20240229',
    vision: true,
    provider: 'anthropic',
    deprecated: true
  },
  {
    text: 'Claude 3 Haiku',
    value: 'claude-3-haiku-20240307',
    vision: true,
    provider: 'anthropic',
    deprecated: true
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
    text: 'Grok 4 Fast (Reasoning)',
    value: 'grok-4-fast-reasoning',
    vision: true,
    reasoning: true,
    provider: 'xai',
    options: {
      isReasoning: true
    }
  },
  {
    text: 'Grok 4 Fast',
    value: 'grok-4-fast-non-reasoning',
    vision: true,
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
    provider: 'xai',
    options: {
      isReasoning: true
    }
  },
  {
    text: 'Grok 3 mini fast',
    value: 'grok-3-mini-fast',
    reasoning: true,
    provider: 'xai',
    options: {
      isReasoning: true
    }
  },
  {
    text: 'Grok 2',
    value: 'grok-2',
    alias: ['grok-2-1212', 'grok-2-latest'],
    provider: 'xai',
    deprecated: true
  },
  {
    text: 'Grok 2 Vision',
    value: 'grok-2-vision',
    alias: ['grok-2-vision-1212', 'grok-2-vision-latest'],
    vision: true,
    provider: 'xai',
    deprecated: true
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
    provider: 'deepseek',
    options: {
      isReasoning: true
    }
  }
];

export const ImageModels: Model[] = [
  {
    text: 'GPT Image 1',
    value: 'gpt-image-1',
    provider: 'openai',
    options: {
      size: ['1024x1024', '1536x1024', '1024x1536']
    }
  },
  {
    text: 'DALL·E 3',
    value: 'dall-e-3',
    provider: 'openai',
    options: {
      size: ['1024x1024', '1792x1024', '1024x1792']
    }
  },
  {
    text: 'DALL·E 2',
    value: 'dall-e-2',
    provider: 'openai',
    deprecated: true,
    options: {
      size: ['256x256', '512x512', '1024x1024']
    }
  },
  {
    text: 'Grok 2 Image',
    value: 'grok-2-image',
    provider: 'xai'
  },
  {
    text: 'Imagen 3',
    value: 'imagen-3.0-generate-002',
    provider: 'google',
    options: {
      aspectRatio: ['1:1', '3:4', '4:3', '9:16', '16:9']
    }
  },
  {
    text: 'Imagen 4',
    value: 'imagen-4.0-generate-001',
    provider: 'google',
    options: {
      aspectRatio: ['1:1', '3:4', '4:3', '9:16', '16:9']
    }
  },
  {
    text: 'Imagen 4 Ultra',
    value: 'imagen-4.0-ultra-generate-001',
    provider: 'google',
    options: {
      aspectRatio: ['1:1', '3:4', '4:3', '9:16', '16:9']
    }
  },
  {
    text: 'Imagen 4 Fast',
    value: 'imagen-4.0-fast-generate-001',
    provider: 'google',
    options: {
      aspectRatio: ['1:1', '3:4', '4:3', '9:16', '16:9']
    }
  }
];

export const VideoModels: Model[] = [
  {
    text: 'Sora 2',
    value: 'sora-2',
    provider: 'openai'
  },
  {
    text: 'Sora 2 Pro',
    value: 'sora-2-pro',
    provider: 'openai'
  },
  {
    text: 'Veo 3.1',
    value: 'veo-3.1-generate-preview',
    provider: 'google'
  },
  {
    text: 'Veo 3.1 Fast',
    value: 'veo-3.1-fast-generate-preview',
    provider: 'google'
  },
  {
    text: 'Veo 3',
    value: 'veo-3.0-generate-001',
    provider: 'google'
  },
  {
    text: 'Veo 3 Fast',
    value: 'veo-3.0-fast-generate-001',
    provider: 'google'
  },
  {
    text: 'Veo 2',
    value: 'veo-2.0-generate-001',
    provider: 'google'
  }
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
  'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet@20250219',
  'claude-3-5-haiku-20241022': 'claude-3-5-haiku@20241022',
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-v2@20241022',
  'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet@20240620',
  'claude-3-opus-20240229': 'claude-3-opus@20240229',
  'claude-3-sonnet-20240229': 'claude-3-sonnet@20240229',
  'claude-3-haiku-20240307': 'claude-3-haiku@20240307'
};
