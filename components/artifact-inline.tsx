'use client';

import { Artifact } from '@/types';
import { DocumentPreview } from '@/components/artifacts/document-preview';

interface ArtifactInlineListProps {
  artifacts: Artifact[];
  onSelect?: (id: string) => void;
}

export function ArtifactInlineList({
  artifacts,
  onSelect
}: ArtifactInlineListProps) {
  if (!artifacts.length) return null;

  return (
    <div
      className={
        artifacts.length > 1
          ? 'ml-12 mt-2 grid gap-2 sm:grid-cols-2'
          : 'ml-12 mt-2 grid grid-cols-1 gap-2'
      }
    >
      {artifacts.map(artifact => (
        <DocumentPreview
          key={artifact.id}
          artifact={artifact}
          onOpen={onSelect}
          hidePreview={true}
          showDownloadButton={true}
        />
      ))}
    </div>
  );
}
