import { ImageSize } from './image-preferences';
import { Provider } from './provider';

export type ChatModelOptions = {
  isReasoning?: boolean;
};

export type ImageModelOptions = {
  size?: ImageSize[];
  aspectRatio?: string[];
};

export type VideoModelOptions = {
  // Reserved for future video-specific options
};

export type VoiceModelOptions = {
  // Reserved for future voice-specific options
};

export type ModelOptions = ChatModelOptions &
  ImageModelOptions &
  VideoModelOptions &
  VoiceModelOptions;

export type Model = {
  text: string;
  value: string;
  alias?: string[];
  vision?: boolean;
  reasoning?: boolean;
  provider: Provider;
  options?: ModelOptions;
  maxOutputTokens?: number;
  parameters?: ModelParameters;
};

export type ModelParameters = {
  temperature?: number;
  topP?: number;
  topK?: number;
  minP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};
