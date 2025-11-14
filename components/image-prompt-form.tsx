import React from 'react';
import { ArrowUp, CircleNotch } from '@phosphor-icons/react';
import Textarea from 'react-textarea-autosize';

import { ImageAspectRatio, ImageSize } from '@/types';
import { ImageModels } from '@/lib/constant';
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

export interface ImagePromptFormProps {
  model: string;
  setModel: (value: string) => void;
  size: ImageSize;
  setSize: (value: ImageSize) => void;
  aspectRatio: ImageAspectRatio;
  setAspectRatio: (value: ImageAspectRatio) => void;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export function ImagePromptForm({
  model,
  setModel,
  size,
  setSize,
  aspectRatio,
  setAspectRatio,
  input,
  setInput,
  isLoading,
  onSubmit
}: ImagePromptFormProps) {
  const selectedModel = findModelByValue('image', model);
  const availableSizes = selectedModel?.options?.size;
  const availableAspectRatios = selectedModel?.options?.aspectRatio;

  const getSizeLabel = (sizeValue: string) => {
    switch (sizeValue) {
      case '256x256':
        return 'Small Square (256x256)';
      case '512x512':
        return 'Medium Square (512x512)';
      case '1024x1024':
        return 'Large Square (1024x1024)';
      case '1536x1024':
        return 'Landscape (1536x1024)';
      case '1024x1536':
        return 'Portrait (1024x1536)';
      case '1792x1024':
        return 'Landscape (1792x1024)';
      case '1024x1792':
        return 'Portrait (1024x1792)';
      default:
        return sizeValue;
    }
  };

  const getAspectRatioLabel = (ratio: string) => {
    switch (ratio) {
      case '1:1':
        return 'Square (1:1)';
      case '2:3':
        return 'Portrait (2:3)';
      case '3:2':
        return 'Landscape (3:2)';
      case '3:4':
        return 'Portrait (3:4)';
      case '4:3':
        return 'Landscape (4:3)';
      case '4:5':
        return 'Portrait (4:5)';
      case '5:4':
        return 'Landscape (5:4)';
      case '9:16':
        return 'Portrait (9:16)';
      case '16:9':
        return 'Landscape (16:9)';
      case '21:9':
        return 'Ultrawide (21:9)';
      default:
        return ratio;
    }
  };

  return (
    <div className="w-full rounded-2xl border bg-background p-4 shadow-md">
      <div className="relative flex w-full items-start space-x-2">
        <Textarea
          autoFocus
          required
          tabIndex={0}
          spellCheck={false}
          placeholder="Describe the image you want to generate..."
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
              {ImageModels.map(m => (
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

          {availableSizes && availableSizes.length > 0 && (
            <Select
              value={size}
              onValueChange={v => setSize(v as ImageSize)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 rounded-full shadow-none">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {availableSizes.map(sizeValue => (
                  <SelectItem key={sizeValue} value={sizeValue}>
                    {getSizeLabel(sizeValue)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {availableAspectRatios && availableAspectRatios.length > 0 && (
            <Select
              value={aspectRatio}
              onValueChange={v => setAspectRatio(v as ImageAspectRatio)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 rounded-full shadow-none">
                <SelectValue placeholder="Select aspect ratio" />
              </SelectTrigger>
              <SelectContent>
                {availableAspectRatios.map(ratio => (
                  <SelectItem key={ratio} value={ratio}>
                    {getAspectRatioLabel(ratio)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
            <span className="sr-only">Generate Image</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
