import { z } from 'zod';

import type { ChatMessage } from './message';

export const chatTypeSchema = z.enum(['chat', 'voice', 'image', 'video']);
export type ChatType = z.infer<typeof chatTypeSchema>;

export type Chat = {
  id: string;
  title: string;
  type: ChatType;
  model: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
};
