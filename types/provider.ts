export type ProviderType =
  | 'openai'
  | 'azure'
  | 'google'
  | 'vertex'
  | 'anthropic'
  | 'bedrock'
  | 'xai'
  | 'deepseek';

export type ProviderConfig = {
  type: ProviderType;
  apiKey?: string | null;
  baseUrl?: string | null;
  apiOptions?: Record<string, unknown> | null;
};
