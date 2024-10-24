import { CoreMessage, ImagePart, TextPart, UserContent } from 'ai';
import { type Session } from 'next-auth';

export type { UserContent, TextPart, ImagePart };

export type User = Session['user'];
export type MessageContent = CoreMessage['content'];

export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  usage: Usage;
  messages: Message[];
  shared: boolean;
  ungenerated?: boolean;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type Message = CoreMessage & {
  id: string;
  chatId?: string;
  userId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export interface Usage extends Record<string, any> {
  model: string;
  stream?: boolean;
  prompt?: string;
  previewToken?: string;
  temperature?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxTokens?: number;
}

export type ModelProvider = 'openai' | 'google' | 'anthropic';

export interface ModelProfile extends Record<string, any> {
  text: string;
  value: string;
  type?: 'chat' | 'images' | 'audio';
  vision?: boolean;
  provider: ModelProvider;
}

export interface ModelSettings extends Record<string, any> {
  prompt?: string;
  temperature: number;
  frequencyPenalty: number;
  presencePenalty: number;
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

export type Result = {
  error: string;
};

export type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
