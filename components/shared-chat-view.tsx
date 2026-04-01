'use client';

import { useMemo, useState } from 'react';

import { Artifact, ChatMessage } from '@/types';
import { ArtifactsPanel } from '@/components/artifacts-panel';
import { Messages } from '@/components/messages';

interface SharedChatViewProps {
  modelId: string;
  messages: ChatMessage[];
  artifacts: Artifact[];
  className?: string;
}

export function SharedChatView({
  modelId,
  messages,
  artifacts,
  className
}: SharedChatViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const artifactList = useMemo(
    () =>
      [...artifacts].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    [artifacts]
  );

  return (
    <div className="flex min-h-0">
      <div className="min-w-0 flex-1">
        <Messages
          className={className}
          modelId={modelId}
          messages={messages}
          artifacts={artifactList}
          onSelectArtifact={artifactId => {
            setSelectedId(artifactId);
            setPanelOpen(true);
          }}
          isReadonly={true}
        />
      </div>
      <ArtifactsPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        artifacts={artifactList}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  );
}
