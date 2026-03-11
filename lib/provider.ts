import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createAzure } from '@ai-sdk/azure';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex';
import { createOpenAI } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';
import { ImageModel, LanguageModel, SpeechModel } from 'ai';

import type { ProviderConfig } from '@/types';

import { BedrockModels, VertexAIModels } from './constant';
import { decrypt } from './crypto';

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
      const vertexKey = apiKey ? JSON.parse(apiKey) : undefined;
      return createVertex({
        project: vertexKey?.project || undefined,
        location: vertexKey?.location || undefined,
        googleAuthOptions: vertexKey?.credentials
          ? { credentials: vertexKey.credentials }
          : undefined
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
