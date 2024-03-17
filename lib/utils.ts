import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

import { Model, ModelProvider, type Usage } from '@/lib/types'
import { KnowledgeCutOffDate, SupportedModels } from '@/lib/constant'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 8-character random string
export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  8
)

// Message id
export const messageId = () => nanoid(6)

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatString(
  formatString: string,
  args: Record<string, any>
): string {
  let formattedString = formatString

  for (const name in args) {
    const placeholder = `{${name}}`
    const value = args[name]

    formattedString = formattedString.replace(placeholder, value)
  }

  return formattedString
}

export const providerFromModel = (value: Model): ModelProvider => {
  const model = SupportedModels.find(m => m.value === value)
  return model ? model.provider : 'openai'
}

export function buildOpenAIUsage(usage: Usage): Usage {
  const fields: string[] = [
    'model',
    'temperature',
    'frequencyPenalty',
    'presencePenalty',
    'topP',
    'maxTokens'
  ]

  const newUsage = {} as Usage

  if (usage.prompt) {
    const model = usage.model
    const time = new Date().toLocaleString()
    const cutoff = KnowledgeCutOffDate[model] ?? KnowledgeCutOffDate.default
    const systemPrompt = formatString(usage.prompt, {
      cutoff,
      model,
      time
    })
    newUsage['prompt'] = systemPrompt
  }

  fields.forEach(field => {
    if (usage[field] !== null && usage[field] !== '') {
      newUsage[field] = usage[field]
    }
  })

  return newUsage
}

export function buildGoogleGenAIUsage(usage: Usage): Usage {
  const fields: string[] = ['model', 'temperature', 'topP', 'topK', 'maxTokens']

  const newUsage = {} as Usage

  fields.forEach(field => {
    if (usage[field] !== null && usage[field] !== '') {
      newUsage[field] = usage[field]
    }
  })

  return newUsage
}

export function buildAnthropicUsage(usage: Usage): Usage {
  const fields: string[] = ['model', 'temperature', 'topP', 'topK', 'maxTokens']

  const newUsage = {} as Usage

  fields.forEach(field => {
    if (usage[field] !== null && usage[field] !== '') {
      newUsage[field] = usage[field]
    }
  })

  return newUsage
}

export function buildChatUsage(usage: Usage): Usage | undefined {
  const provider = providerFromModel(usage.model)

  if (provider === 'openai') {
    return buildOpenAIUsage(usage)
  }

  if (provider === 'google') {
    return buildGoogleGenAIUsage(usage)
  }

  if (provider === 'anthropic') {
    return buildAnthropicUsage(usage)
  }

  return undefined
}
