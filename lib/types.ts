import { type Message as AIMessage } from 'ai'
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions'

export type Message = AIMessage

export type ChatCategory =
  | 'Today'
  | 'Yesterday'
  | 'Previous 7 Days'
  | 'Previous Month'
  | 'Older'

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  userId: string
  messages: Message[]
  sharing: boolean
  usage: Usage
}

export interface Usage extends Record<string, any> {
  model: Model
  stream?: boolean
  prompt?: string
  previewToken?: string
  temperature?: number
  frequencyPenalty?: number
  presencePenalty?: number
  topP?: number
  topK?: number
  maxTokens?: number
}

export type Model =
  | ChatCompletionCreateParamsBase['model']
  | 'gemini-pro'
  | 'gemini-pro-vision'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-2.1'
  | 'claude-2.0'
  | 'claude-instant-1.2'

export type ModelProvider = 'openai' | 'google' | 'anthropic'

export interface ModelSettings extends Record<string, any> {
  prompt?: string
  temperature: number
  frequencyPenalty: number
  presencePenalty: number
  topP: number
  topK: number
  maxTokens: number
}

export interface AIToken extends Record<string, any> {
  openai?: string
  google?: string
  anthropic?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>
