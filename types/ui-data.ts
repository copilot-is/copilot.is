import type { LanguageModelUsage } from 'ai';
import type { UsageData } from 'tokenlens/helpers';

import type { Artifact, ArtifactType } from './artifact';

// Server-merged usage: base usage + TokenLens summary + optional modelId
export type Usage = LanguageModelUsage & UsageData & { modelId?: string };

export type CustomUIDataTypes = {
  chat: { title: string };
  usage: Usage;
  appendMessage: string;
  artifact: {
    artifact: Artifact;
  };
  textDelta: {
    id: string;
    delta: string;
    mode?: 'append' | 'replace';
    status?: 'streaming' | 'done';
    title?: string;
    artifactType: ArtifactType;
  };
  codeDelta: {
    id: string;
    delta: string;
    mode?: 'append' | 'replace';
    status?: 'streaming' | 'done';
    title?: string;
    language?: string;
    artifactType: ArtifactType;
  };
  imageDelta: {
    id: string;
    url: string;
    status?: 'streaming' | 'done';
    title?: string;
    artifactType: ArtifactType;
  };
  fileDelta: {
    id: string;
    url: string;
    status?: 'streaming' | 'done';
    title?: string;
    fileName?: string | null;
    mimeType?: string | null;
    size?: number | null;
    artifactType: ArtifactType;
  };
  messageId: string;
  id: string;
  title: {
    id: string;
    title: string;
  };
  kind: {
    id: string;
    kind: 'text' | 'code' | 'image' | 'sheet' | 'file';
    artifactType: ArtifactType;
  };
  clear: {
    id: string;
  };
  finish: {
    id: string;
  };
};
