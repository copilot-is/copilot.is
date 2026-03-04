/**
 * Provider types for the console
 */
export const ProviderTypes = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'google', label: 'Google AI' },
  { value: 'vertex', label: 'Google Vertex' },
  { value: 'anthropic', label: 'Anthropic' },
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
  '2:3': 'Portrait (2:3)',
  '3:2': 'Landscape (3:2)',
  '3:4': 'Portrait (3:4)',
  '4:3': 'Landscape (4:3)',
  '4:5': 'Portrait (4:5)',
  '5:4': 'Landscape (5:4)',
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
  'claude-sonnet-4-5-20250929': 'claude-sonnet-4-5@20250929',
  'claude-haiku-4-5-20250929': 'claude-haiku-4-5@20250929',
  'claude-opus-4-5-20250929': 'claude-opus-4-5@20250929',
  'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet@20250219',
  'claude-3-5-haiku-20241022': 'claude-3-5-haiku@20241022',
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-v2@20241022',
  'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet@20240620',
  'claude-3-opus-20240229': 'claude-3-opus@20240229',
  'claude-3-sonnet-20240229': 'claude-3-sonnet@20240229',
  'claude-3-haiku-20240307': 'claude-3-haiku@20240307'
};
