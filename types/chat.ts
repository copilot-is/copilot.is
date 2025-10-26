import type { ChatMessage } from './message';

export type Chat = {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
};
