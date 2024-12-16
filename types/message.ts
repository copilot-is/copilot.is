import { z } from 'zod';

import { dataContentSchema } from './data-content';
import { jsonValueSchema } from './json-value';

export const messageSchema = z.discriminatedUnion('role', [
  z.object({
    id: z.string(),
    role: z.literal('system'),
    content: z.string(),
    createdAt: z.union([
      z.date().optional(),
      z
        .string()
        .transform(str => new Date(str))
        .optional()
    ]),
    experimental_providerMetadata: z
      .record(z.string(), z.record(z.string(), jsonValueSchema))
      .optional()
  }),
  z.object({
    id: z.string(),
    role: z.literal('user'),
    content: z.union([
      z.string(),
      z.array(
        z.union([
          z.object({
            type: z.literal('text'),
            text: z.string()
          }),
          z.object({
            type: z.literal('image'),
            image: dataContentSchema,
            mimeType: z.string().optional()
          }),
          z.object({
            type: z.literal('file'),
            data: dataContentSchema,
            mimeType: z.string()
          })
        ])
      )
    ]),
    createdAt: z.union([
      z.date().optional(),
      z
        .string()
        .transform(str => new Date(str))
        .optional()
    ]),
    experimental_providerMetadata: z
      .record(z.string(), z.record(z.string(), jsonValueSchema))
      .optional()
  }),
  z.object({
    id: z.string(),
    role: z.literal('assistant'),
    content: z.union([
      z.string(),
      z.array(
        z.union([
          z.object({
            type: z.literal('text'),
            text: z.string()
          }),
          z.object({
            type: z.literal('tool-call'),
            toolCallId: z.string(),
            toolName: z.string(),
            args: z.unknown()
          })
        ])
      )
    ]),
    createdAt: z.union([
      z.date().optional(),
      z
        .string()
        .transform(str => new Date(str))
        .optional()
    ]),
    experimental_providerMetadata: z
      .record(z.string(), z.record(z.string(), jsonValueSchema))
      .optional()
  }),
  z.object({
    id: z.string(),
    role: z.literal('tool'),
    content: z.array(
      z.object({
        type: z.literal('tool-result'),
        toolCallId: z.string(),
        toolName: z.string(),
        result: z.unknown(),
        experimental_content: z.optional(
          z.array(
            z.union([
              z.object({
                type: z.literal('text'),
                text: z.string()
              }),
              z.object({
                type: z.literal('image'),
                data: z.string(),
                mimeType: z.string().optional()
              })
            ])
          )
        ),
        isError: z.boolean().optional(),
        experimental_providerMetadata: z
          .record(z.string(), z.record(z.string(), jsonValueSchema))
          .optional()
      })
    ),
    createdAt: z.union([
      z.date().optional(),
      z
        .string()
        .transform(str => new Date(str))
        .optional()
    ]),
    experimental_providerMetadata: z
      .record(z.string(), z.record(z.string(), jsonValueSchema))
      .optional()
  })
]);
