import { Provider } from './provider';

export type Model = {
  text: string;
  value: string;
  alias?: string[];
  vision?: boolean;
  reasoning?: boolean;
  provider: Provider;
};

export type ChatModelSettings = {
  prompt: string;
  temperature: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
};
