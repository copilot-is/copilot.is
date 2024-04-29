import { type Message as AIMessage } from 'ai'
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions'

export interface MessageContentDetail {
  type: 'text' | 'image'
  text?: string
  data?: string
}

export type MessageContent = string | MessageContentDetail[]

export type Message = AIMessage & {
  content: MessageContent
}

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
  //axTokens?: number
}

export type Model =
  | ChatCompletionCreateParamsBase['model']
  | 'gemini-1.0-pro'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'

export type ModelProvider = 'openai' | 'google' | 'anthropic'

export interface ModelSettings extends Record<string, any> {
  prompt?: string
  temperature: number
 //maxTokens: number
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

export interface FileInfo extends Record<string, any> {
  name: string
  type: string
  data: string
}