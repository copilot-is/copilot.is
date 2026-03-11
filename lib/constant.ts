/**
 * Provider types for the console
 */
export const ProviderTypes = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'google', label: 'Google AI' },
  { value: 'vertex', label: 'Google Vertex' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'bedrock', label: 'AWS Bedrock' },
  { value: 'xai', label: 'xAI' },
  { value: 'deepseek', label: 'DeepSeek' }
] as const;

/**
 * Image size labels mapping
 */
export const ImageSizeLabels: Record<string, string> = {
  '256x256': 'Small Square (256x256)',
  '512x512': 'Medium Square (512x512)',
  '1024x1024': 'Large Square (1024x1024)',
  '512': '512px',
  '1K': '1K',
  '2K': '2K',
  '4K': '4K',
  '1536x1024': 'Landscape (1536x1024)',
  '1024x1536': 'Portrait (1024x1536)',
  '1792x1024': 'Landscape (1792x1024)',
  '1024x1792': 'Portrait (1024x1792)'
};

/**
 * Aspect ratio labels mapping
 */
export const AspectRatioLabels: Record<string, string> = {
  '1:1': 'Square (1:1)',
  '1:4': 'Ultra Portrait (1:4)',
  '1:8': 'Ultra Portrait (1:8)',
  '2:3': 'Portrait (2:3)',
  '3:2': 'Landscape (3:2)',
  '3:4': 'Portrait (3:4)',
  '4:1': 'Ultra Landscape (4:1)',
  '4:3': 'Landscape (4:3)',
  '4:5': 'Portrait (4:5)',
  '5:4': 'Landscape (5:4)',
  '8:1': 'Ultra Landscape (8:1)',
  '9:16': 'Portrait (9:16)',
  '16:9': 'Landscape (16:9)',
  '21:9': 'Ultrawide (21:9)'
};

/**
 * Video resolution labels mapping
 */
export const VideoResolutionLabels: Record<string, string> = {
  '480p': '480p (SD)',
  '720p': '720p (HD)',
  '1080p': '1080p (Full HD)',
  '4k': '4K (Ultra HD)'
};

/**
 * Vertex AI model ID mapping (Anthropic model ID -> Vertex AI model ID)
 */
export const VertexAIModels: Record<string, string> = {
  'claude-sonnet-4-5': 'claude-sonnet-4-5@20250929',
  'claude-sonnet-4-5-20250929': 'claude-sonnet-4-5@20250929',
  'claude-opus-4-5': 'claude-opus-4-5@20251101',
  'claude-opus-4-5-20251101': 'claude-opus-4-5@20251101',
  'claude-haiku-4-5': 'claude-haiku-4-5@20251001',
  'claude-haiku-4-5-20251001': 'claude-haiku-4-5@20251001',
  'claude-opus-4-1': 'claude-opus-4-1@20250805',
  'claude-opus-4-1-20250805': 'claude-opus-4-1@20250805',
  'claude-sonnet-4-0': 'claude-sonnet-4@20250514',
  'claude-sonnet-4-20250514': 'claude-sonnet-4@20250514',
  'claude-opus-4-0': 'claude-opus-4@20250514',
  'claude-opus-4-20250514': 'claude-opus-4@20250514'
};

/**
 * AWS Bedrock model ID mapping (Anthropic model ID -> Bedrock model ID)
 */
export const BedrockModels: Record<string, string> = {
  'claude-opus-4-6': 'anthropic.claude-opus-4-6-v1',
  'claude-sonnet-4-6': 'anthropic.claude-sonnet-4-6',
  'claude-sonnet-4-5': 'anthropic.claude-sonnet-4-5-20250929-v1:0',
  'claude-sonnet-4-5-20250929': 'anthropic.claude-sonnet-4-5-20250929-v1:0',
  'claude-opus-4-5': 'anthropic.claude-opus-4-5-20251101-v1:0',
  'claude-opus-4-5-20251101': 'anthropic.claude-opus-4-5-20251101-v1:0',
  'claude-haiku-4-5': 'anthropic.claude-haiku-4-5-20251001-v1:0',
  'claude-haiku-4-5-20251001': 'anthropic.claude-haiku-4-5-20251001-v1:0',
  'claude-opus-4-1': 'anthropic.claude-opus-4-1-20250805-v1:0',
  'claude-opus-4-1-20250805': 'anthropic.claude-opus-4-1-20250805-v1:0',
  'claude-sonnet-4-0': 'anthropic.claude-sonnet-4-20250514-v1:0',
  'claude-sonnet-4-20250514': 'anthropic.claude-sonnet-4-20250514-v1:0',
  'claude-opus-4-0': 'anthropic.claude-opus-4-20250514-v1:0',
  'claude-opus-4-20250514': 'anthropic.claude-opus-4-20250514-v1:0'
};
