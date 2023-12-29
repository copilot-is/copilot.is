import { type Model, ModelProvider } from '@/lib/types'

export const KnowledgeCutOffDate: Record<string, string> = {
  default: '2021-09',
  'gpt-4-1106-preview': '2023-04',
  'gpt-4-vision-preview': '2023-04'
}

export const SupportedModels: {
  text: string
  value: Model
  provider: ModelProvider
}[] = [
  {
    text: 'GPT-4 1106 Preview',
    value: 'gpt-4-1106-preview',
    provider: 'openai'
  },
  {
    text: 'GPT-4 Vision Preview',
    value: 'gpt-4-vision-preview',
    provider: 'openai'
  },
  { text: 'GPT-4', value: 'gpt-4', provider: 'openai' },
  { text: 'GPT-4 0314', value: 'gpt-4-0314', provider: 'openai' },
  { text: 'GPT-4 0613', value: 'gpt-4-0613', provider: 'openai' },
  { text: 'GPT-4 32k', value: 'gpt-4-32k', provider: 'openai' },
  { text: 'GPT-4 32k 0314', value: 'gpt-4-32k-0314', provider: 'openai' },
  { text: 'GPT-4 32k 0613', value: 'gpt-4-32k-0613', provider: 'openai' },
  {
    text: 'GPT-3.5 Turbo 1106',
    value: 'gpt-3.5-turbo-1106',
    provider: 'openai'
  },
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
    text: 'GPT-3.5 Turbo 16k 0613',
    value: 'gpt-3.5-turbo-16k-0613',
    provider: 'openai'
  },
  { text: 'Gemini Pro', value: 'gemini-pro', provider: 'google' },
  { text: 'Gemini Pro Vision', value: 'gemini-pro-vision', provider: 'google' }
]

export const SystemPrompt =
  '\nYou are ChatGPT, a large language model trained by OpenAI.\nKnowledge cutoff: {cutoff}\nCurrent model: {model}\nCurrent time: {time}\nLatex inline: $x^2$ \nLatex block: $$e=mc^2$$\n\n'
