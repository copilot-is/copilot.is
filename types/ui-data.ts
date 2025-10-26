import type { LanguageModelUsage } from 'ai';
import type { UsageData } from 'tokenlens/helpers';

// Server-merged usage: base usage + TokenLens summary + optional modelId
export type Usage = LanguageModelUsage & UsageData & { modelId?: string };

export type CustomUIDataTypes = {
  chat: { title: string; isNew: boolean };
  usage: Usage;
  appendMessage: string;
};
