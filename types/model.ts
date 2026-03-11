import type { ProviderType } from './provider';

// Model capability type
export type ModelCapability = 'chat' | 'image' | 'video' | 'audio';

// UI options for different model types
export type ModelUIOptions = {
  size?: string;
  sizes?: string[];
  aspectRatio?: string;
  aspectRatios?: string[];
  duration?: number;
  durations?: number[];
  resolution?: string;
  resolutions?: string[];
  voice?: string;
  voices?: string[];
  reasoning?: boolean;
};

// API parameters for model configuration
export type ModelAPIParams = {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};

// Provider information from database
export type ModelProvider = {
  id: string;
  name: string;
  type: ProviderType;
  image?: string | null;
  isEnabled: boolean;
};

/**
 * Model type aligned with database schema
 * This is the unified model type used across the application
 */
export type Model = {
  // Database fields
  id: string;
  name: string;
  modelId: string;
  providerId: string;
  capability: ModelCapability;
  image?: string | null;
  aliases?: string[] | null;
  supportsVision?: boolean | null;
  supportsReasoning?: boolean | null;
  isEnabled: boolean;
  uiOptions?: ModelUIOptions | null;
  apiParams?: ModelAPIParams | null;
  displayOrder: number;
  provider?: ModelProvider | null;
};
