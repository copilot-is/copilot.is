import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createAzure } from '@ai-sdk/azure';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex';
import { createOpenAI } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';
import {
  BedrockClient,
  ListFoundationModelsCommand
} from '@aws-sdk/client-bedrock';
import { GoogleGenAI } from '@google/genai';
import { ImageModel, LanguageModel, SpeechModel } from 'ai';

import type { ProviderConfig, VertexServiceAccountKey } from '@/types';

import { BedrockModels, VertexAIModels } from './constant';
import { decrypt } from './crypto';

function getProviderBaseUrl(provider: ProviderConfig) {
  if (provider.baseUrl) {
    return provider.baseUrl.replace(/\/+$/, '');
  }

  switch (provider.type) {
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'anthropic':
      return 'https://api.anthropic.com';
    case 'google':
      return 'https://generativelanguage.googleapis.com';
    case 'xai':
      return 'https://api.x.ai/v1';
    case 'deepseek':
      return 'https://api.deepseek.com';
    case 'azure':
      throw new Error('Azure provider baseUrl is required to fetch models');
    case 'vertex':
      throw new Error('Vertex provider uses SDK model listing');
    case 'bedrock':
      return 'https://bedrock.us-east-1.amazonaws.com';
    default:
      throw new Error(`Unknown provider: ${provider.type}`);
  }
}

/**
 * Convert model ID to Vertex AI format if needed
 */
function toVertexModelId(modelId: string): string {
  return VertexAIModels[modelId] || modelId;
}

/**
 * Convert model ID to AWS Bedrock format if needed
 */
function toBedrockModelId(modelId: string): string {
  return BedrockModels[modelId] || modelId;
}

/**
 * Create provider SDK instance based on type and config
 */
function createProviderSDK(config: ProviderConfig): any {
  const { type, baseUrl } = config;
  const apiKey = config.apiKey ? decrypt(config.apiKey) : undefined;

  switch (type) {
    case 'openai':
      return createOpenAI({
        apiKey: apiKey || undefined,
        baseURL: baseUrl || undefined
      });

    case 'azure':
      return createAzure({
        apiKey: apiKey || undefined,
        baseURL: baseUrl ? baseUrl + '/openai/deployments' : undefined
      });

    case 'google':
      return createGoogleGenerativeAI({
        apiKey: apiKey || undefined,
        baseURL: baseUrl || undefined
      });

    case 'vertex': {
      let vertexKey: VertexServiceAccountKey | null = null;

      if (apiKey) {
        try {
          vertexKey = JSON.parse(apiKey) as VertexServiceAccountKey;
        } catch {}
      }

      if (vertexKey?.location && vertexKey.credentials) {
        return createVertex({
          project: vertexKey.credentials.project_id,
          location: vertexKey.location,
          googleAuthOptions: {
            credentials: vertexKey.credentials
          }
        });
      }

      return createVertex({
        apiKey: apiKey || undefined
      });
    }

    case 'bedrock': {
      const bedrockKey = apiKey ? JSON.parse(apiKey) : undefined;

      return createAmazonBedrock({
        region: bedrockKey?.region || undefined,
        accessKeyId: bedrockKey?.accessKeyId || undefined,
        secretAccessKey: bedrockKey?.secretAccessKey || undefined,
        sessionToken: bedrockKey?.sessionToken || undefined
      });
    }

    case 'anthropic':
      return createAnthropic({
        apiKey: apiKey || undefined,
        baseURL: baseUrl || undefined
      });

    case 'xai':
      return createXai({
        apiKey: apiKey || undefined,
        baseURL: baseUrl || undefined
      });

    case 'deepseek':
      return createDeepSeek({
        apiKey: apiKey || undefined,
        baseURL: baseUrl || undefined
      });

    default:
      throw new Error(`Unknown provider: ${type}`);
  }
}

/**
 * Get a language model by provider config and model ID
 */
export function getLanguageModel(
  provider: ProviderConfig,
  modelId: string
): LanguageModel {
  const sdk = createProviderSDK(provider);
  const resolvedModelId =
    provider.type === 'vertex'
      ? toVertexModelId(modelId)
      : provider.type === 'bedrock'
        ? toBedrockModelId(modelId)
        : modelId;
  return sdk(resolvedModelId);
}

/**
 * Get an image model by provider config and model ID
 */
export function getImageModel(
  provider: ProviderConfig,
  modelId: string
): ImageModel {
  const sdk = createProviderSDK(provider);
  return sdk.image(modelId);
}

/**
 * Get a speech model by provider config and model ID
 */
export function getSpeechModel(
  provider: ProviderConfig,
  modelId: string
): SpeechModel {
  const sdk = createProviderSDK(provider);
  return sdk.speech(modelId);
}

/**
 * Get a video model by provider config and model ID
 */
export function getVideoModel(provider: ProviderConfig, modelId: string) {
  const sdk = createProviderSDK(provider);
  return sdk.video(modelId);
}

export async function getProviderModels(
  provider: ProviderConfig
): Promise<string[]> {
  if (!provider.apiKey) {
    throw new Error('Provider API key is required to fetch models');
  }

  const apiKey = decrypt(provider.apiKey);
  const baseUrl =
    provider.type === 'vertex' ? undefined : getProviderBaseUrl(provider);
  let response: Response;

  switch (provider.type) {
    case 'openai':
    case 'xai':
    case 'deepseek':
      response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });
      break;

    case 'anthropic':
      response = await fetch(`${baseUrl}/v1/models`, {
        headers: {
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey ?? ''
        }
      });
      break;

    case 'google':
      response = await fetch(`${baseUrl}/v1beta/models?key=${apiKey}`);
      break;

    case 'azure':
      response = await fetch(
        `${baseUrl}/openai/deployments?api-version=2024-10-21`,
        {
          headers: {
            'api-key': apiKey ?? ''
          }
        }
      );
      break;

    case 'vertex': {
      let vertexKey: VertexServiceAccountKey | null = null;

      try {
        vertexKey = JSON.parse(apiKey) as VertexServiceAccountKey;
      } catch {}

      const ai =
        vertexKey?.location && vertexKey.credentials
          ? new GoogleGenAI({
              vertexai: true,
              project: vertexKey.credentials.project_id,
              location: vertexKey.location,
              googleAuthOptions: {
                credentials: vertexKey.credentials
              }
            })
          : new GoogleGenAI({
              vertexai: true,
              apiKey
            });
      const pager = await ai.models.list();
      const vertexModels: string[] = [];

      for await (const model of pager) {
        if (!model.name) continue;

        vertexModels.push(model.name.split('/').pop() ?? model.name);
      }

      return vertexModels;
    }

    case 'bedrock': {
      const credentials = JSON.parse(apiKey) as {
        region?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        sessionToken?: string;
      };

      if (
        !credentials.region ||
        !credentials.accessKeyId ||
        !credentials.secretAccessKey
      ) {
        throw new Error(
          'Bedrock credentials must include region, accessKeyId, and secretAccessKey'
        );
      }

      const bedrockClient = new BedrockClient({
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        },
        ...(provider.baseUrl && { endpoint: provider.baseUrl })
      });
      const data = await bedrockClient.send(
        new ListFoundationModelsCommand({})
      );

      return (
        data.modelSummaries
          ?.map(model => model.modelId)
          .filter((modelId): modelId is string => Boolean(modelId)) ?? []
      );
    }

    default:
      throw new Error(`Fetching models is not supported for ${provider.type}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch provider models: ${response.status}`);
  }

  const data = await response.json();
  const items =
    typeof data === 'object' && data !== null && 'data' in data
      ? (data as { data: unknown }).data
      : typeof data === 'object' && data !== null && 'models' in data
        ? (data as { models: unknown }).models
        : typeof data === 'object' && data !== null && 'value' in data
          ? (data as { value: unknown }).value
          : typeof data === 'object' &&
              data !== null &&
              'modelSummaries' in data
            ? (data as { modelSummaries: unknown }).modelSummaries
            : [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(item => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = record.id ?? record.name ?? record.model ?? record.modelId;

      if (typeof id !== 'string') {
        return null;
      }

      return id.replace(/^models\//, '');
    })
    .filter((modelId): modelId is string => modelId !== null);
}
