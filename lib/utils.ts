import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'
import { type Message } from 'ai'
import {
  type ChatCompletion,
  type ChatCompletionMessageParam
} from 'openai/resources'
import { type GenerateContentResult } from '@google/generative-ai'

import { type Usage } from '@/lib/types'

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

export const buildOpenAIPrompt = (messages: Message[], prompt?: string) => {
  const systemMessage = { role: 'system', content: prompt } as Message
  const mergedMessages = prompt ? [systemMessage, ...messages] : messages

  return mergedMessages.map(
    ({ role, content, name, function_call }) =>
      ({
        role,
        content,
        ...(name !== undefined && { name }),
        ...(function_call !== undefined && { function_call })
      }) as ChatCompletionMessageParam
  )
}

export const buildGoogleGenAIPrompt = (messages: Message[]) => ({
  contents: messages
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }]
    }))
})

export function buildOpenAIUsage(usage: Usage): Usage {
  const fields: string[] = [
    'model',
    'temperature',
    'frequencyPenalty',
    'presencePenalty',
    'topP'
  ]

  const newUsage = {} as Usage

  fields.forEach(field => {
    if (usage[field] !== null && usage[field] !== '') {
      newUsage[field] = usage[field]
    }
  })

  return newUsage
}

export function buildGoogleGenAIUsage(usage: Usage): Usage {
  const fields: string[] = ['model', 'temperature', 'topP', 'topK']

  const newUsage = {} as Usage

  fields.forEach(field => {
    if (usage[field] !== null && usage[field] !== '') {
      newUsage[field] = usage[field]
    }
  })

  return newUsage
}

export function buildOpenAIMessages(result: ChatCompletion): Message[] {
  const messages: Message[] = []

  result.choices.forEach(choice => {
    const { message } = choice

    const role = message.role
    const content = message.content || ''

    messages.push({ id: messageId(), role, content })
  })

  return messages
}

export function buildGoogleGenAIMessages(
  result: GenerateContentResult
): Message[] {
  const messages: Message[] = []

  result.response.candidates?.forEach(candidate => {
    const { content } = candidate

    const parts = content.parts[0].text || ''
    const role = content.role === 'user' ? 'user' : 'assistant'

    const message: Message = {
      id: messageId(),
      role,
      content: parts
    }
    messages.push(message)
  })

  return messages
}
