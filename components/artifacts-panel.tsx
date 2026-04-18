'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { Artifact } from '@/types';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { ArtifactViewer } from '@/components/artifact-viewer';
import { getArtifactPreviewModeDefault } from '@/components/artifacts/runtime-preview';

interface ArtifactsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifacts: Artifact[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

export function ArtifactsPanel({
  open,
  onOpenChange,
  artifacts,
  selectedId,
  onSelect
}: ArtifactsPanelProps) {
  const [viewMode, setViewMode] = useState<'source' | 'preview'>('source');
  const sortedArtifacts = useMemo(
    () =>
      [...artifacts].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    [artifacts]
  );

  const selected =
    sortedArtifacts.find(artifact => artifact.id === selectedId) ??
    sortedArtifacts[0];
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (!selected) return;
    setViewMode(getArtifactPreviewModeDefault(selected));
  }, [selected?.id]);

  useEffect(() => {
    if (selected?.status !== 'streaming') return;
    if (viewMode !== 'preview') return;
    setViewMode('source');
  }, [selected?.id, selected?.status, viewMode]);

  if (!open) {
    return null;
  }

  const content =
    artifacts.length === 0 ? (
      <div className="flex h-full flex-col">
        <div className="sticky top-0 z-10 flex h-16 items-center justify-end border-b bg-background px-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No artifacts yet.
        </div>
      </div>
    ) : (
      <div className="flex h-full min-h-0 flex-col">
        <div className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4">
          <ArtifactViewer
            artifact={selected}
            artifacts={sortedArtifacts}
            onSelectArtifact={onSelect}
            onClose={() => onOpenChange(false)}
            hideContent={true}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <ArtifactViewer
            artifact={selected}
            artifacts={sortedArtifacts}
            hideHeader={true}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>
    );

  return (
    <>
      {isDesktop && (
        <div className="h-full w-[min(56vw,760px)] max-w-[820px] min-w-[440px] flex-col border-l bg-background md:flex">
          <div className="min-h-0 flex-1">{content}</div>
        </div>
      )}

      {!isDesktop && (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="right" className="w-full p-0 sm:max-w-none">
            <div className="flex h-full flex-col">
              <div className="border-b px-5 py-4 pr-12">
                <SheetTitle>Artifacts</SheetTitle>
              </div>
              <div className="min-h-0 flex-1">{content}</div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
