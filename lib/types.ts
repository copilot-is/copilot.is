import { CoreMessage, ImagePart, TextPart, UserContent } from 'ai';
import { type Session } from 'next-auth';
import { ChatModel } from 'openai/resources';

export type { UserContent, TextPart, ImagePart };

export type User = Session['user'];

export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
  messages: Message[];
  sharing: boolean;
  usage: Usage;
}

export type Message = CoreMessage & {
  id: string;
  chatId?: string;
  userId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

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

export type ChatCategory =
  | 'Today'
  | 'Yesterday'
  | 'Previous 7 Days'
  | 'Previous Month'
  | 'Older';

export interface FileInfo extends Record<string, any> {
  name: string;
  type: string;
  data: string;
}

export type Result = {
  error: string;
};
