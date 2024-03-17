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

export function buildChatUsage(usage: Usage): Usage {
  const generalFields = ['model', 'stream', 'previewToken']
  const providerFields = {
    openai: [
      'temperature',
      'frequencyPenalty',
      'presencePenalty',
      'topP',
      'maxTokens'
    ],
    google: ['temperature', 'topP', 'topK', 'maxTokens'],
    anthropic: ['temperature', 'topP', 'topK', 'maxTokens']
  }

  const provider = providerFromModel(usage.model)
  const fields = generalFields.concat(providerFields[provider])

  const newUsage = {} as Usage

  if (provider === 'openai' && usage.prompt) {
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

  for (const field of fields) {
    if (
      usage[field] !== undefined &&
      usage[field] !== null &&
      usage[field] !== ''
    ) {
      newUsage[field] = usage[field]
    }
  }

  return newUsage
}
