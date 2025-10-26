import { UIMessage } from 'ai';
import { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';

import { messages } from '@/server/db/schema';

import {
  dataUIPartSchema,
  dynamicToolUIPartSchema,
  fileUIPartSchema,
  reasoningUIPartSchema,
  sourceDocumentUIPartSchema,
  sourceUrlUIPartSchema,
  stepStartUIPartSchema,
  textUIPartSchema,
  toolUIPartSchema
} from './content-part';
import type { CustomUIDataTypes } from './ui-data';

export type DBMessage = Omit<
  InferSelectModel<typeof messages>,
  'userId' | 'chatId'
>;

export const messageMetadataSchema = z.object({
  parentId: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes>;

export const messageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['system', 'user', 'assistant']),
  parts: z.array(
    z.union([
      textUIPartSchema,
      reasoningUIPartSchema,
      toolUIPartSchema,
      dynamicToolUIPartSchema,
      sourceUrlUIPartSchema,
      sourceDocumentUIPartSchema,
      fileUIPartSchema,
      dataUIPartSchema,
      stepStartUIPartSchema
    ])
  ),
  metadata: messageMetadataSchema.optional()
});
