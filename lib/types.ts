import { CoreMessage, ImagePart, TextPart, UserContent } from 'ai';
import { type Message as AIMessage } from 'ai/react';
import { type Session } from 'next-auth';

export type { UserContent, TextPart, ImagePart, AIMessage };
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

export type Message = Omit<AIMessage, 'role' | 'content' | 'createdAt'> & {
  chatId?: string;
  userId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
} & CoreMessage;

export interface Usage extends Record<string, any> {
  model: string;
  stream?: boolean;
  prompt?: string;
  temperature?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxTokens?: number;
}

export type Provider = 'openai' | 'google' | 'anthropic' | 'xai' | 'deepseek';

export interface Model extends Record<string, any> {
  text: string;
  value: string;
  type?: 'chat' | 'images' | 'audio';
  vision?: boolean;
  provider: Provider;
}

export interface Settings extends Record<string, any> {
  prompt: string;
  temperature: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
}

export interface TTS extends Record<string, any> {
  enabled?: boolean;
  model?: string;
  voice?: Voice;
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

export type APIProvider = 'azure' | 'vertex';
