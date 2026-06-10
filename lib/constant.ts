import type { ModelCapability } from '@/types/model';

/**
 * Provider types for the console
 */
export const ProviderTypes = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'google', label: 'Google AI' },
  { value: 'vertex', label: 'Google Vertex AI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'bedrock', label: 'AWS Bedrock' },
  { value: 'xai', label: 'xAI' },
  { value: 'deepseek', label: 'DeepSeek' }
] as const;

/**
 * Model and prompt capabilities
 */
export const CAPABILITIES = [
  { value: 'chat', label: 'Chat' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' }
] satisfies Array<{ value: ModelCapability; label: string }>;

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

export const ArtifactSystemPrompt = [
  'Use the create_artifact tool for substantial, self-contained, reusable content: code files, runnable React UIs, full documents, data tables, or generated media. Do NOT use it for short snippets, brief explanations, or conversational replies — keep those inline in the chat.',
  '',
  'Always set a concise, descriptive `title` (2–6 words) — it labels the artifact in the canvas and the artifact switcher.',
  '',
  'Choose `type`:',
  '- code: source code. Set `language` (e.g. tsx, ts, python, sql).',
  '- markdown / html / text: rendered or plain documents.',
  '- json: structured data; an array of row objects (or arrays) renders as a table.',
  '- image / file: generated media — provide `fileUrl` and `mimeType` (plus `fileName`/`size` when known).',
  '',
  'For non-file types, always put the COMPLETE content in `content`. Never truncate or use placeholders like "// rest unchanged". Each create_artifact call produces a separate artifact; to revise something, create a new artifact with the full updated content.',
  '',
  'Live Preview is available for html, markdown, SVG (type code, language svg), and React/TS code. To make React/TS code previewable, follow this contract exactly:',
  '- Use type "code" with `language` one of react/tsx/jsx/typescript/javascript.',
  '- The entry/root file MUST `export default` the root React component — that default export is what Preview renders.',
  '- Every code artifact must set an exact relative `fileName`; name the entry file index.tsx.',
  '- Any file containing JSX must use a .tsx or .jsx fileName.',
  '- Keep it to ONE self-contained file: put every component/helper in this single artifact and do not import sibling files (other artifacts are not in scope).',
  '- Allowed package imports: react, react-dom, react-dom/client, lucide-react, framer-motion, recharts, clsx, class-variance-authority. No Next.js APIs, server code, env vars, remote assets, or any other npm package.',
  '- Styling: Tailwind utility classes work (a Tailwind v4 runtime is bundled into the preview), and inline styles or a <style> tag also work. CSS-file imports do NOT apply at runtime.',
  '',
  'HTML artifacts (type "html") must be a single self-contained document; inline <style>/<script> are fine. Preview runs sandboxed with no access to the host page.'
].join('\n');
