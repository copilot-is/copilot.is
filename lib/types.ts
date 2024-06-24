import { ChatModel } from 'openai/resources';

export interface MessageContentDetail {
  type: 'text' | 'image';
  text?: string;
  data?: string;
}

export type MessageContent = string | MessageContentDetail[];

export type Message = {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'function' | 'data' | 'tool';
  content: MessageContent;
  name?: string;
  function_call?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ChatCategory =
  | 'Today'
  | 'Yesterday'
  | 'Previous 7 Days'
  | 'Previous Month'
  | 'Older';

export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  messages?: Message[];
  sharing: boolean;
  usage: Usage;
}

export interface Usage extends Record<string, any> {
  model: Model;
  stream?: boolean;
  prompt?: string;
  previewToken?: string;
  temperature?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
}

export type Model =
  | string
  | ChatModel
  | 'dall-e-3'
  | 'gemini-1.5-flash-latest'
  | 'gemini-1.5-pro-latest'
  | 'gemini-pro'
  | 'gemini-pro-vision'
  | 'claude-3-5-sonnet-20240620'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  | 'claude-2.1'
  | 'claude-2.0'
  | 'claude-instant-1.2';

export type ModelProvider = 'openai' | 'google' | 'anthropic';

export interface ModelSettings extends Record<string, any> {
  prompt?: string;
  temperature: number;
  frequencyPenalty: number;
  presencePenalty: number;
  topP: number;
  topK: number;
  maxTokens: number;
}

export interface AIToken extends Record<string, any> {
  openai?: string;
  google?: string;
  anthropic?: string;
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string;
    }
>;

export interface FileInfo extends Record<string, any> {
  name: string;
  type: string;
  data: string;
}
