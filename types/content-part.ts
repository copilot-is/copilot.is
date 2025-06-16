import { LanguageModelV1Source } from '@ai-sdk/provider';
import {
  FileUIPart,
  ReasoningUIPart,
  SourceUIPart,
  StepStartUIPart,
  TextUIPart,
  ToolInvocation,
  ToolInvocationUIPart
} from '@ai-sdk/ui-utils';
import { z } from 'zod';

import { providerMetadataSchema } from './provider-metadata';

export const textUIPartSchema: z.ZodType<TextUIPart> = z.object({
  type: z.literal('text'),
  text: z.string()
});

export const reasoningUIPartSchema: z.ZodType<ReasoningUIPart> = z.object({
  type: z.literal('reasoning'),
  reasoning: z.string(),
  details: z.array(
    z.union([
      z.object({
        type: z.literal('text'),
        text: z.string(),
        signature: z.string().optional()
      }),
      z.object({
        type: z.literal('redacted'),
        data: z.string()
      })
    ])
  )
});

export const toolInvocationSchema: z.ZodType<ToolInvocation> = z.union([
  z.object({
    state: z.literal('partial-call'),
    step: z.number().optional(),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.any()
  }),
  z.object({
    state: z.literal('call'),
    step: z.number().optional(),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.any()
  }),
  z.object({
    state: z.literal('result'),
    step: z.number().optional(),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.any(),
    result: z.any()
  })
]) as z.ZodType<ToolInvocation>;

export const toolInvocationUIPartSchema: z.ZodType<ToolInvocationUIPart> =
  z.object({
    type: z.literal('tool-invocation'),
    toolInvocation: toolInvocationSchema
  });

export const languageModelV1SourceSchema: z.ZodType<LanguageModelV1Source> =
  z.object({
    sourceType: z.literal('url'),
    id: z.string(),
    url: z.string(),
    title: z.string().optional(),
    providerMetadata: providerMetadataSchema.optional()
  });

export const sourceUIPartSchema: z.ZodType<SourceUIPart> = z.object({
  type: z.literal('source'),
  source: languageModelV1SourceSchema
});

export const fileUIPartSchema: z.ZodType<FileUIPart> = z.object({
  type: z.literal('file'),
  mimeType: z.string(),
  data: z.string()
});

export const stepStartUIPartSchema: z.ZodType<StepStartUIPart> = z.object({
  type: z.literal('step-start')
});
