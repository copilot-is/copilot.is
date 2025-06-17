import { UIMessage } from '@ai-sdk/ui-utils';
import { z } from 'zod';

import { attachmentSchema } from './attachment';
import {
  fileUIPartSchema,
  reasoningUIPartSchema,
  sourceUIPartSchema,
  stepStartUIPartSchema,
  textUIPartSchema,
  toolInvocationUIPartSchema
} from './content-part';

declare module 'ai' {
  interface Message {
    parentId?: string | null;
    updatedAt?: Date;
  }
}

export const messageSchema: z.ZodType<UIMessage> = z.object({
  id: z.string().min(1),
  parentId: z.string().optional(),
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  parts: z.array(
    z.union([
      textUIPartSchema,
      reasoningUIPartSchema,
      toolInvocationUIPartSchema,
      sourceUIPartSchema,
      fileUIPartSchema,
      stepStartUIPartSchema
    ])
  ),
  experimental_attachments: z.array(attachmentSchema).optional(),
  createdAt: z.coerce.date().optional()
});
