'use client';

import { UseChatHelpers } from '@ai-sdk/react';

import { ChatMessage, Model, Provider } from '@/types';
import { ServiceProvider } from '@/lib/constant';
import { findModelByValue } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/hooks/use-settings';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ProviderIcon } from '@/components/provider-icon';

export interface ChatModelMenuProps
  extends Pick<UseChatHelpers<ChatMessage>, 'status'> {
  model: string;
  setModel: (value: string) => void;
}

export function ChatModelMenu({ status, model, setModel }: ChatModelMenuProps) {
  const isMobile = useIsMobile();
  const selectedModel = findModelByValue('chat', model);
  const { systemSettings } = useSettings();
  const { availableModels } = systemSettings;

  const groupedModels = availableModels.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<Provider, Model[]>
  );

  return (
    <Select
      disabled={status === 'submitted' || status === 'streaming'}
      value={selectedModel?.value}
      onValueChange={setModel}
    >
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
        {availableModels.length > 0 ? (
          Object.entries(groupedModels).map(([provider, models]) => (
            <SelectGroup key={provider}>
              <SelectLabel asChild>
                <div className="flex items-center px-2 py-1.5">
                  <ProviderIcon
                    className="opacity-45 grayscale"
                    provider={provider as Provider}
                  />
                  <div className="ml-2 text-xs font-normal text-muted-foreground">
                    {ServiceProvider[provider as Provider]}
                  </div>
                </div>
              </SelectLabel>
              {models.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center">
                    <ProviderIcon provider={model.provider} />
                    <div className="ml-2">
                      <div className="font-medium">{model.text}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.value}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        ) : (
          <div className="py-1 text-center text-sm text-muted-foreground">
            No available models
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
