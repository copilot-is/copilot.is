'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { Artifact } from '@/types';
import { cn } from '@/lib/utils';
import {
  artifactRegistry,
  getArtifactKind,
  getArtifactLanguageLabel
} from '@/components/artifacts/registry';

interface DocumentPreviewProps {
  artifact: Artifact;
  onOpen?: (id: string) => void;
  hidePreview?: boolean;
  showDownloadButton?: boolean;
}

export function DocumentPreview({
  artifact,
  onOpen,
  hidePreview,
  showDownloadButton
}: DocumentPreviewProps) {
  const kind = getArtifactKind(artifact);
  const registry = artifactRegistry[kind];
  const Icon = registry.icon;
  const languageLabel =
    kind === 'code' || kind === 'text'
      ? getArtifactLanguageLabel(artifact)
      : '';
  const canDownload = Boolean(artifact.fileUrl || artifact.content);

  const handleDownload = () => {
    if (artifact.fileUrl) {
      const link = document.createElement('a');
      link.href = artifact.fileUrl;
      link.target = '_blank';
      link.download = artifact.fileName || artifact.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!artifact.content) {
      toast.error('Nothing to download');
      return;
    }

    const extension =
      artifact.type === 'json'
        ? 'json'
        : artifact.type === 'html'
          ? 'html'
          : artifact.type === 'markdown'
            ? 'md'
            : artifact.language || 'txt';
    const blob = new Blob([artifact.content], {
      type: 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.title}.${extension}`.replace(/\s+/g, '-');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'w-full rounded-lg border bg-background px-3 py-2.5 text-left transition hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden'
      )}
      onClick={() => onOpen?.(artifact.id)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen?.(artifact.id);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="truncate text-sm font-medium">{artifact.title}</div>
          <div className="shrink-0 text-xs text-muted-foreground">
            {languageLabel || registry.label}
          </div>
        </div>
        {showDownloadButton ? (
          <button
            type="button"
            className="ml-auto inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            disabled={!canDownload}
            onClick={event => {
              event.stopPropagation();
              handleDownload();
            }}
          >
            <Download className="size-4" />
            <span className="sr-only">Download artifact</span>
          </button>
        ) : (
          <Download className="ml-auto size-4 text-muted-foreground opacity-50" />
        )}
      </div>
      {!hidePreview && (
        <div className="mt-2">{registry.renderPreview(artifact)}</div>
      )}
    </div>
  );
}
