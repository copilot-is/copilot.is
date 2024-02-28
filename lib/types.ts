import { type Message as AIMessage } from 'ai'
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions'

export type Message = AIMessage

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  userId: string
  messages: Message[]
  shared: boolean
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
}

export type Model =
  | ChatCompletionCreateParamsBase['model']
  | 'gemini-pro'
  | 'gemini-pro-vision'

export type ModelProvider = 'openai' | 'google'

export interface ModelSettings extends Record<string, any> {
  prompt?: string
  temperature: number
  frequencyPenalty: number
  presencePenalty: number
  topP: number
  topK: number
}

export interface AIToken extends Record<string, any> {
  openai?: string
  google?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>
