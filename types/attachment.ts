import { Attachment } from '@ai-sdk/ui-utils';
import { z } from 'zod';

export const attachmentSchema: z.ZodType<Attachment> = z.object({
  name: z.string().optional(),
  contentType: z.string().optional(),
  url: z.string()
});
