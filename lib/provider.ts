import { createAnthropic } from '@ai-sdk/anthropic';
import { createAzure } from '@ai-sdk/azure';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex';
import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';
import { customProvider } from 'ai';
import OpenAI, { AzureOpenAI } from 'openai';
import { APIPromise } from 'openai/core';

import { OpenAISpeechParams, Provider } from '@/types';

import { ChatModels, ImageModels, TTSModels } from './constant';
import { env } from './env';

const modelProvider: Record<Provider, any> = {
  openai:
    env.OPENAI_API_PROVIDER === 'azure'
      ? createAzure({
          apiKey: env.AZURE_API_KEY,
          baseURL: env.AZURE_BASE_URL
            ? env.AZURE_BASE_URL + '/openai/deployments'
            : undefined
        })
      : createOpenAI({
          apiKey: env.OPENAI_API_KEY,
          baseURL: env.OPENAI_BASE_URL
        }),
  google:
    env.GOOGLE_API_PROVIDER === 'vertex'
      ? createVertex({
          project: env.GOOGLE_VERTEX_PROJECT,
          location: env.GOOGLE_VERTEX_LOCATION,
          googleAuthOptions: {
            credentials: JSON.parse(env.GOOGLE_APPLICATION_CREDENTIALS || '{}')
          }
        })
      : createGoogleGenerativeAI({
          apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
          baseURL: env.GOOGLE_GENERATIVE_AI_BASE_URL
        }),
  anthropic:
    env.ANTHROPIC_API_PROVIDER === 'vertex'
      ? createVertexAnthropic({
          project: env.GOOGLE_VERTEX_PROJECT,
          location: env.GOOGLE_VERTEX_LOCATION,
          googleAuthOptions: {
            credentials: JSON.parse(env.GOOGLE_APPLICATION_CREDENTIALS || '{}')
          }
        })
      : createAnthropic({
          apiKey: env.ANTHROPIC_API_KEY,
          baseURL: env.ANTHROPIC_BASE_URL
        }),
  xai: createXai({
    apiKey: env.XAI_API_KEY,
    baseURL: env.XAI_BASE_URL
  }),
  deepseek: createDeepSeek({
    apiKey: env.DEEPSEEK_API_KEY,
    baseURL: env.DEEPSEEK_BASE_URL
  })
};

export const provider = customProvider({
  languageModels: ChatModels.reduce(
    (acc, model) => {
      acc[model.value] = modelProvider[model.provider](model.value);
      return acc;
    },
    {} as Record<string, any>
  ),
  imageModels: ImageModels.reduce(
    (acc, model) => {
      acc[model.value] = modelProvider[model.provider](model.value);
      return acc;
    },
    {} as Record<string, any>
  )
});

const speechProvider: Partial<
  Record<Provider, (params: OpenAISpeechParams) => APIPromise<Response>>
> = {
  openai: (params: OpenAISpeechParams) => {
    const openai =
      env.OPENAI_API_PROVIDER === 'azure'
        ? new AzureOpenAI({
            apiKey: env.AZURE_API_KEY,
            endpoint: env.AZURE_BASE_URL,
            deployment: params.model,
            apiVersion: '2024-08-01-preview'
          })
        : new OpenAI({
            apiKey: env.OPENAI_API_KEY,
            baseURL: env.OPENAI_BASE_URL
          });
    return openai.audio.speech.create({
      model: env.OPENAI_API_PROVIDER === 'azure' ? '' : params.model,
      input: params.input,
      voice: params.voice || 'alloy',
      response_format: params.response_format || 'mp3'
    });
  }
};

export function generateSpeech(
  params: OpenAISpeechParams
): APIPromise<Response> {
  const provider = TTSModels.find(model => model.value === params.model)
    ?.provider as keyof typeof speechProvider;

  if (!speechProvider[provider]) {
    throw new Error(`Speech provider not found for model: ${params.model}`);
  }

  return speechProvider[provider](params);
}
