'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, Copy, Download, LoaderCircle, X } from 'lucide-react';
import { toast } from 'sonner';

import { Artifact } from '@/types';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  artifactRegistry,
  getArtifactKind,
  getArtifactLanguageLabel
} from '@/components/artifacts/registry';

interface ArtifactViewerProps {
  artifact?: Artifact;
  artifacts?: Artifact[];
  onSelectArtifact?: (id: string) => void;
  onClose?: () => void;
  hideHeader?: boolean;
  hideContent?: boolean;
}

const isFileArtifact = (artifact?: Artifact) =>
  artifact?.type === 'image' || artifact?.type === 'file';

export function ArtifactViewer({
  artifact,
  artifacts = [],
  onSelectArtifact,
  onClose,
  hideHeader,
  hideContent
}: ArtifactViewerProps) {
  const { copyToClipboard } = useCopyToClipboard();

  if (!artifact) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Select an artifact to view.
      </div>
    );
  }

  const isFile = isFileArtifact(artifact);
  const canCopyContent = !isFile && !!(artifact.content ?? '').trim();
  const kind = getArtifactKind(artifact);
  const registry = artifactRegistry[kind];
  const languageLabel =
    kind === 'code' || kind === 'text'
      ? getArtifactLanguageLabel(artifact)
      : '';
  const headerActionButtonClassName = 'size-7 text-muted-foreground';
  const isStreaming = artifact.status === 'streaming';
  const isDone = artifact.status === 'done';
  const contentRef = useRef<HTMLDivElement>(null);
  const isHeaderActionDisabled = isStreaming;
  const canDownload = Boolean(artifact.fileUrl || artifact.content);

  const statusIndicator = isStreaming ? (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-normal text-muted-foreground">
      <LoaderCircle className="size-3 animate-spin" />
      Streaming...
    </span>
  ) : isDone ? (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-normal text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="size-3" />
      Done
    </span>
  ) : null;

  useEffect(() => {
    if (hideContent) return;
    if (!contentRef.current) return;
    if (!isStreaming && !isDone) return;

    requestAnimationFrame(() => {
      if (!contentRef.current) return;
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    });
  }, [
    artifact.content,
    artifact.fileUrl,
    artifact.id,
    hideContent,
    isDone,
    isStreaming
  ]);

  const content = (
    <div
      ref={contentRef}
      className={cn(
        'min-h-0 flex-1 overflow-auto rounded-md bg-background p-4',
        (kind === 'code' || kind === 'sheet') && 'p-0',
        kind !== 'code' && kind !== 'sheet' && 'border'
      )}
    >
      {registry.renderContent(artifact)}
    </div>
  );

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
    <div className="flex size-full min-h-0 flex-col justify-center gap-3">
      {!hideHeader && (
        <div className="relative flex gap-3">
          <div className="flex min-w-0 max-w-full items-center gap-2 pr-28">
            {artifacts.length > 1 ? (
              <Select
                value={artifact.id}
                onValueChange={value => onSelectArtifact?.(value)}
                disabled={isHeaderActionDisabled}
              >
                <SelectTrigger className="h-6 w-fit min-w-0 max-w-full border-0 p-0 text-sm font-semibold shadow-none">
                  <div className="flex min-w-0 items-center gap-2">
                    <SelectValue>
                      <span className="truncate">{artifact.title}</span>
                    </SelectValue>
                    <span className="shrink-0 text-xs font-normal text-muted-foreground">
                      {languageLabel || artifact.type}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent align="start">
                  {artifacts.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{item.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {getArtifactLanguageLabel(item) || item.type}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <div className="truncate text-sm font-semibold">
                  {artifact.title}
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {languageLabel || artifact.type}
                </div>
              </div>
            )}
            {statusIndicator}
          </div>
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {canCopyContent && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={headerActionButtonClassName}
                    disabled={isHeaderActionDisabled}
                    onClick={async () => {
                      await copyToClipboard(artifact.content ?? '');
                      toast.success('Copied');
                    }}
                  >
                    <Copy className="size-4" />
                    <span className="sr-only">Copy artifact</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={headerActionButtonClassName}
                  disabled={isHeaderActionDisabled || !canDownload}
                  onClick={handleDownload}
                >
                  <Download className="size-4" />
                  <span className="sr-only">Download artifact</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            {onClose && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={headerActionButtonClassName}
                    disabled={isHeaderActionDisabled}
                    onClick={onClose}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}
      {!hideContent && content}
    </div>
  );
}
