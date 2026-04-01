'use client';

import { Code2, File, FileText, Image as ImageIcon, Table } from 'lucide-react';

import { Artifact } from '@/types';
import { getArtifactLanguageLabel } from '@/lib/code-language';
import { CodeBlock } from '@/components/codeblock';
import { MessageMarkdown } from '@/components/message-markdown';

export { getArtifactLanguageLabel } from '@/lib/code-language';

export type ArtifactKind = 'text' | 'code' | 'image' | 'sheet' | 'file';

export const getArtifactKind = (artifact: Artifact): ArtifactKind => {
  if (artifact.type === 'image') return 'image';
  if (artifact.type === 'file') return 'file';
  if (artifact.type === 'json') return 'sheet';
  if (artifact.type === 'code' || artifact.type === 'html') {
    return 'code';
  }
  return 'text';
};

const isImageMime = (mimeType?: string | null) =>
  !!mimeType && mimeType.startsWith('image/');
const isVideoMime = (mimeType?: string | null) =>
  !!mimeType && mimeType.startsWith('video/');
const isAudioMime = (mimeType?: string | null) =>
  !!mimeType && mimeType.startsWith('audio/');
const isPdfMime = (mimeType?: string | null) => mimeType === 'application/pdf';

export const artifactRegistry: Record<
  ArtifactKind,
  {
    label: string;
    icon: typeof FileText;
    renderPreview: (artifact: Artifact) => React.ReactNode;
    renderContent: (artifact: Artifact) => React.ReactNode;
  }
> = {
  text: {
    label: 'Text',
    icon: FileText,
    renderPreview: artifact => (
      <div className="line-clamp-3 text-xs text-muted-foreground">
        {artifact.content ?? ''}
      </div>
    ),
    renderContent: artifact => {
      if (artifact.type === 'markdown') {
        return <MessageMarkdown content={artifact.content ?? ''} />;
      }
      return (
        <pre className="whitespace-pre-wrap text-sm">
          {artifact.content ?? ''}
        </pre>
      );
    }
  },
  code: {
    label: 'Code',
    icon: Code2,
    renderPreview: artifact => (
      <div className="line-clamp-3 text-xs text-muted-foreground">
        {artifact.content ?? ''}
      </div>
    ),
    renderContent: artifact => (
      <CodeBlock
        language={getArtifactLanguageLabel(artifact)}
        value={artifact.content ?? ''}
        autoScrollToBottom={artifact.status === 'streaming'}
        showHeader={false}
        wrapLongLines={true}
        bordered={false}
      />
    )
  },
  sheet: {
    label: 'Sheet',
    icon: Table,
    renderPreview: artifact => {
      try {
        const rows = JSON.parse(artifact.content ?? '[]');
        if (Array.isArray(rows)) {
          return (
            <div className="text-xs text-muted-foreground">
              {rows.length} rows
            </div>
          );
        }
      } catch {}
      return <div className="text-xs text-muted-foreground">Invalid JSON</div>;
    },
    renderContent: artifact => (
      <CodeBlock
        language="json"
        value={artifact.content ?? ''}
        autoScrollToBottom={artifact.status === 'streaming'}
        showHeader={false}
        wrapLongLines={true}
        bordered={false}
      />
    )
  },
  image: {
    label: 'Image',
    icon: ImageIcon,
    renderPreview: artifact =>
      artifact.fileUrl ? (
        <img
          className="h-20 w-full rounded-md object-cover"
          src={artifact.fileUrl}
          alt={artifact.title}
        />
      ) : (
        <div className="text-xs text-muted-foreground">No image</div>
      ),
    renderContent: artifact =>
      artifact.fileUrl ? (
        <img
          className="max-h-[480px] w-auto rounded-md"
          src={artifact.fileUrl}
          alt={artifact.title}
        />
      ) : (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Image URL unavailable.
        </div>
      )
  },
  file: {
    label: 'File',
    icon: File,
    renderPreview: artifact => {
      if (artifact.fileUrl && isImageMime(artifact.mimeType)) {
        return (
          <img
            className="h-20 w-full rounded-md object-cover"
            src={artifact.fileUrl}
            alt={artifact.title}
          />
        );
      }
      return (
        <div className="text-xs text-muted-foreground">
          {artifact.fileName ||
            (artifact.fileUrl ? 'File' : 'File URL unavailable')}
        </div>
      );
    },
    renderContent: artifact => {
      if (artifact.fileUrl && isImageMime(artifact.mimeType)) {
        return (
          <img
            className="max-h-[480px] w-auto rounded-md"
            src={artifact.fileUrl}
            alt={artifact.title}
          />
        );
      }

      if (artifact.fileUrl && isVideoMime(artifact.mimeType)) {
        return (
          <video
            className="max-h-[480px] w-auto rounded-md"
            controls
            src={artifact.fileUrl}
          />
        );
      }

      if (artifact.fileUrl && isAudioMime(artifact.mimeType)) {
        return <audio className="w-full" controls src={artifact.fileUrl} />;
      }

      if (artifact.fileUrl && isPdfMime(artifact.mimeType)) {
        return (
          <iframe
            className="h-[70vh] w-full rounded-md border"
            src={artifact.fileUrl}
            title={artifact.title}
          />
        );
      }

      return (
        <div className="flex flex-col gap-3 text-sm">
          <div className="truncate">{artifact.fileName || 'File'}</div>
          {artifact.mimeType && (
            <div className="text-xs text-muted-foreground">
              {artifact.mimeType}
            </div>
          )}
          {!artifact.fileUrl && (
            <div className="text-xs text-muted-foreground">
              File URL unavailable.
            </div>
          )}
          {artifact.fileUrl && (
            <a
              href={artifact.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary"
            >
              Download
            </a>
          )}
        </div>
      );
    }
  }
};
