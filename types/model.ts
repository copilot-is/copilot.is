import { Provider } from './provider';

export type Model = {
  text: string;
  value: string;
  alias?: string[];
  vision?: boolean;
  reasoning?: boolean;
  provider: Provider;
  options?: {
    isReasoning?: boolean;
  };
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
