import React from 'react';
import { ArrowUp, CircleNotch } from '@phosphor-icons/react';
import Textarea from 'react-textarea-autosize';

import { Voice } from '@/types';
import { TTSModels, Voices } from '@/lib/constant';
import { findModelByValue } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ProviderIcon } from '@/components/provider-icon';

export interface VoicePromptFormProps {
  model: string;
  setModel: (value: string) => void;
  voice: Voice;
  setVoice: (value: Voice) => void;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export function VoicePromptForm({
  model,
  setModel,
  voice,
  setVoice,
  input,
  setInput,
  isLoading,
  onSubmit
}: VoicePromptFormProps) {
  const selectedModel = findModelByValue('voice', model);

  return (
    <div className="w-full rounded-2xl border bg-background p-4 shadow-md">
      <div className="relative flex w-full items-start space-x-2">
        <Textarea
          autoFocus
          required
          tabIndex={0}
          spellCheck={false}
          placeholder="Enter text to convert to speech..."
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
        <div className="flex items-center space-x-2">
          <Select value={model} onValueChange={setModel} disabled={isLoading}>
            <SelectTrigger className="h-9 rounded-full border shadow-none hover:bg-accent">
              <SelectValue placeholder="Select model">
                <div className="flex items-center">
                  <ProviderIcon provider={selectedModel?.provider} />
                  <span className="ml-2 text-sm font-medium">
                    {selectedModel?.text}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TTSModels.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  <div className="flex items-center">
                    <ProviderIcon provider={m.provider} />
                    <div className="ml-2">
                      <div className="font-medium">{m.text}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.value}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={voice}
            onValueChange={v => setVoice(v as Voice)}
            disabled={isLoading}
          >
            <SelectTrigger className="h-9 rounded-full shadow-none">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {Voices.map(v => (
                <SelectItem key={v} value={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            size="icon"
            className="size-9 rounded-full shadow-none"
            onClick={onSubmit}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <CircleNotch className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
            <span className="sr-only">Generate Voice</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
