import React from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import Textarea from 'react-textarea-autosize';

import { Button } from '@/components/ui/button';
import { ModelMenu, ModelOptions } from '@/components/model-menu';

export interface VideoPromptFormProps {
  modelId: string;
  aspectRatio?: string;
  resolution?: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onModelChange: (model: string) => void;
  onOptionsChange?: (options: ModelOptions) => void;
}

export function VideoPromptForm({
  modelId,
  aspectRatio,
  resolution,
  input,
  setInput,
  isLoading,
  onSubmit,
  onModelChange,
  onOptionsChange
}: VideoPromptFormProps) {
  // Convert isLoading to status for ModelMenu compatibility
  const status = isLoading ? 'streaming' : 'ready';

  return (
    <div className="w-full rounded-2xl border bg-background p-4 shadow-md">
      <div className="relative flex w-full items-start space-x-2">
        <Textarea
          autoFocus
          required
          tabIndex={0}
          spellCheck={false}
          placeholder="Describe the video you want to generate..."
          className="flex-1 resize-none bg-transparent p-1 focus-within:outline-none"
          rows={1}
          minRows={1}
          maxRows={8}
          disabled={isLoading}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              if (!input.trim()) {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              onSubmit();
            }
          }}
        />
      </div>
      <div className="mt-5 flex items-center justify-between space-x-2">
        <ModelMenu
          capability="video"
          status={status as 'ready' | 'streaming' | 'submitted' | 'error'}
          modelId={modelId}
          onModelChange={onModelChange}
          onOptionsChange={onOptionsChange}
          aspectRatio={aspectRatio}
          resolution={resolution}
        />
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            size="icon"
            className="size-9 rounded-full shadow-none"
            onClick={onSubmit}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
            <span className="sr-only">Generate Video</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
