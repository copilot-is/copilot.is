'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePreferences } from '@/contexts/preferences-context';
import { useSystemSettings } from '@/contexts/system-settings-context';
import { UseChatHelpers } from '@ai-sdk/react';
import { ChevronDown, Eye, Lightbulb } from 'lucide-react';

import { ChatMessage, Model } from '@/types';
import {
  AspectRatioLabels,
  ImageSizeLabels,
  VideoResolutionLabels
} from '@/lib/constant';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { ModelIcon } from '@/components/model-icon';

// API capability type (matches tRPC router schema - excludes 'speech')
type APICapability = 'chat' | 'image' | 'video' | 'audio';

export interface ModelMenuProps extends Pick<
  UseChatHelpers<ChatMessage>,
  'status'
> {
  /** The capability type for model selection */
  capability?: APICapability;
  /** Current model value (controlled) */
  modelId: string;
  /** Callback when model changes */
  onModelChange: (modelId: string) => void;
  /** Callback when model options change (like reasoning, size, aspectRatio, voice) */
  onOptionsChange?: (options: ModelOptions) => void;
  /** Current size value (for image capability) */
  size?: string;
  /** Current aspect ratio value (for image & video capability) */
  aspectRatio?: string;
  /** Current resolution value (for video capability) */
  resolution?: string;
  /** Current voice value (for audio capability) */
  voice?: string;
}

export interface ModelOptions {
  isReasoning?: boolean;
  supportsVision?: boolean;
  supportsReasoning?: boolean;
  /** Size value (for image) */
  size?: string;
  /** AspectRatio value (for image & video) */
  aspectRatio?: string;
  /** Resolution value (for video) */
  resolution?: string;
  /** Voice value (for audio) */
  voice?: string;
}

export function ModelMenu({
  status,
  capability = 'chat',
  modelId,
  onModelChange,
  onOptionsChange,
  size,
  aspectRatio,
  resolution,
  voice
}: ModelMenuProps) {
  // Prevent hydration mismatch with Radix Select
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Get models from context
  const { chatModels, imageModels, videoModels, ttsModels } =
    useSystemSettings();
  const { preferences, setPreference } = usePreferences();

  // Get models by capability
  const availableModels = useMemo(() => {
    switch (capability) {
      case 'chat':
        return chatModels;
      case 'image':
        return imageModels;
      case 'video':
        return videoModels;
      case 'audio':
        return ttsModels;
      default:
        return [];
    }
  }, [capability, chatModels, imageModels, videoModels, ttsModels]);

  // Track isReasoning state from preferences
  const [isReasoning, setIsReasoning] = useState(preferences.chatReasoning);

  // Find selected model from database models
  const selectedModel = useMemo(
    () =>
      availableModels?.find(
        m => m.modelId === modelId || (m.aliases && m.aliases.includes(modelId))
      ),
    [availableModels, modelId]
  );

  // Get available options from selected model
  const uiOptions = selectedModel?.uiOptions as Record<string, unknown> | null;
  const availableSizes = useMemo(
    () => (uiOptions?.sizes as string[]) || [],
    [uiOptions?.sizes]
  );
  const availableAspectRatios = useMemo(
    () => (uiOptions?.aspectRatios as string[]) || [],
    [uiOptions?.aspectRatios]
  );
  const availableResolutions = useMemo(
    () => (uiOptions?.resolutions as string[]) || [],
    [uiOptions?.resolutions]
  );
  const availableVoices = useMemo(
    () => (uiOptions?.voices as string[]) || [],
    [uiOptions?.voices]
  );

  // Notify parent of model capabilities and auto-select options
  useEffect(() => {
    if (!selectedModel) return;

    // Notify supportsVision on mount and model change
    onOptionsChange?.({
      supportsVision: selectedModel.supportsVision ?? undefined
    });

    // Auto-select first size if available and no size is set
    if (capability === 'image' && availableSizes.length > 0 && !size) {
      onOptionsChange?.({ size: availableSizes[0] });
    }

    // Auto-select first aspectRatio if available and no aspectRatio is set
    if (
      (capability === 'image' || capability === 'video') &&
      availableAspectRatios.length > 0 &&
      !aspectRatio
    ) {
      onOptionsChange?.({ aspectRatio: availableAspectRatios[0] });
    }

    // Auto-select first resolution if available and no resolution is set
    if (
      capability === 'video' &&
      availableResolutions.length > 0 &&
      !resolution
    ) {
      onOptionsChange?.({ resolution: availableResolutions[0] });
    }

    // Auto-select first voice if available and no voice is set
    if (capability === 'audio' && availableVoices.length > 0 && !voice) {
      onOptionsChange?.({ voice: availableVoices[0] });
    }
  }, [
    selectedModel,
    capability,
    size,
    aspectRatio,
    resolution,
    voice,
    availableSizes,
    availableAspectRatios,
    availableResolutions,
    availableVoices,
    onOptionsChange
  ]);

  if (!mounted) {
    return <Skeleton className="h-9 w-32 rounded-full" />;
  }

  // Grouped models by provider for display
  const groupedModels = (availableModels ?? [])
    .filter(m => m.provider)
    .reduce(
      (acc, m) => {
        const providerKey = m.provider!.id;
        if (!acc[providerKey]) {
          acc[providerKey] = [];
        }
        acc[providerKey].push(m);
        return acc;
      },
      {} as Record<string, Model[]>
    );

  // Handler for model change
  const handleModelChange = (newModel: string) => {
    // Ignore empty values (Radix Select fires empty change during hydration)
    if (!newModel) return;

    // Notify parent (parent handles saving to preferences)
    onModelChange(newModel);

    // Find the new model and notify about its options
    const newModelData = availableModels?.find(m => m.modelId === newModel);
    if (newModelData) {
      const supportsReasoning = newModelData.uiOptions?.reasoning;
      onOptionsChange?.({
        supportsVision: newModelData.supportsVision ?? undefined,
        supportsReasoning: supportsReasoning ?? undefined,
        isReasoning: supportsReasoning ? isReasoning : undefined
      });
    }
  };

  // Handler for reasoning toggle (only for chat capability)
  const handleReasoningToggle = () => {
    if (capability !== 'chat') return;
    const newValue = !isReasoning;
    setIsReasoning(newValue);
    setPreference('chatReasoning', newValue);
    onOptionsChange?.({
      supportsVision: selectedModel?.supportsVision ?? undefined,
      supportsReasoning: selectedModel?.uiOptions?.reasoning ?? undefined,
      isReasoning: newValue
    });
  };

  const isDisabled = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex items-center space-x-2">
      <Select
        disabled={isDisabled}
        value={selectedModel?.modelId || ''}
        onValueChange={handleModelChange}
      >
        <SelectTrigger
          className={cn(
            'h-9 rounded-full border shadow-none hover:bg-accent',
            '[&>svg:last-child]:hidden'
          )}
        >
          <div className="flex items-center">
            {selectedModel ? (
              <>
                <ModelIcon
                  image={
                    selectedModel.image || selectedModel.provider?.image || null
                  }
                  className="mr-2 size-4"
                />
                <span className="text-sm font-medium">
                  {selectedModel.name}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                Select model
              </span>
            )}
          </div>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </SelectTrigger>
        <SelectContent>
          {availableModels && availableModels.length > 0 ? (
            Object.entries(groupedModels).map(([providerId, models]) => (
              <SelectGroup key={providerId}>
                <SelectLabel asChild>
                  <div className="flex items-center px-2 py-1.5">
                    <ModelIcon
                      className="mr-2 size-4 opacity-45 grayscale"
                      image={models[0]?.provider?.image || null}
                    />
                    <div className="text-xs font-normal text-muted-foreground">
                      {models[0]?.provider?.name || 'Unknown'}
                    </div>
                  </div>
                </SelectLabel>
                {models.map(m => (
                  <SelectItem
                    key={m.modelId}
                    value={m.modelId}
                    className="pr-2 data-[state=checked]:bg-accent [&>span:first-child]:hidden [&>span:last-child]:w-full"
                  >
                    <div className="flex w-full items-start">
                      <ModelIcon
                        image={m.image || m.provider?.image || null}
                        className="mr-2 mt-0.5 size-4"
                      />
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.modelId}
                        </div>
                      </div>
                      {(m.supportsReasoning || m.supportsVision) && (
                        <div className="ml-auto flex items-center gap-1 pl-3 pt-0.5">
                          {m.supportsVision && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="rounded bg-blue-100 p-0.5 dark:bg-blue-900/30">
                                  <Eye className="size-3 text-blue-600 dark:text-blue-400" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Supports vision</TooltipContent>
                            </Tooltip>
                          )}
                          {m.supportsReasoning && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="rounded bg-amber-100 p-0.5 dark:bg-amber-900/30">
                                  <Lightbulb className="size-3 text-amber-600 dark:text-amber-400" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Supports reasoning
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          ) : (
            <div className="px-2 py-1 text-center text-sm text-muted-foreground">
              No available models
            </div>
          )}
        </SelectContent>
      </Select>

      {capability === 'chat' && selectedModel?.uiOptions?.reasoning && (
        <Button
          type="button"
          variant="outline"
          disabled={status === 'submitted' || status === 'streaming'}
          className={cn(
            'h-9 rounded-full px-3 font-normal text-muted-foreground shadow-none hover:text-muted-foreground',
            {
              'border-muted-foreground/30 bg-muted text-foreground hover:text-foreground':
                isReasoning
            }
          )}
          onClick={handleReasoningToggle}
        >
          <Lightbulb
            className={
              isReasoning ? 'fill-muted-foreground' : 'fill-muted-foreground/30'
            }
          />
          Think
        </Button>
      )}

      {/* Size selector for image capability */}
      {capability === 'image' && availableSizes.length > 0 && (
        <Select
          disabled={isDisabled}
          value={size || ''}
          onValueChange={newSize => onOptionsChange?.({ size: newSize })}
        >
          <SelectTrigger className="h-9 rounded-full shadow-none">
            <span className="text-sm">
              {size ? ImageSizeLabels[size] || size : 'Size'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {availableSizes.map(s => (
              <SelectItem key={s} value={s}>
                {ImageSizeLabels[s] || s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* AspectRatio selector for image & video capability */}
      {(capability === 'image' || capability === 'video') &&
        availableAspectRatios.length > 0 && (
          <Select
            disabled={isDisabled}
            value={aspectRatio || ''}
            onValueChange={newRatio =>
              onOptionsChange?.({ aspectRatio: newRatio })
            }
          >
            <SelectTrigger className="h-9 rounded-full shadow-none">
              <span className="text-sm">
                {aspectRatio
                  ? AspectRatioLabels[aspectRatio] || aspectRatio
                  : 'Aspect'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {availableAspectRatios.map(r => (
                <SelectItem key={r} value={r}>
                  {AspectRatioLabels[r] || r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

      {/* Resolution selector for video capability */}
      {capability === 'video' && availableResolutions.length > 0 && (
        <Select
          disabled={isDisabled}
          value={resolution || ''}
          onValueChange={newResolution =>
            onOptionsChange?.({ resolution: newResolution })
          }
        >
          <SelectTrigger className="h-9 rounded-full shadow-none">
            <span className="text-sm">
              {resolution
                ? VideoResolutionLabels[resolution] || resolution
                : 'Resolution'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {availableResolutions.map(r => (
              <SelectItem key={r} value={r}>
                {VideoResolutionLabels[r] || r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Voice selector for audio capability */}
      {capability === 'audio' && availableVoices.length > 0 && (
        <Select
          disabled={isDisabled}
          value={voice || ''}
          onValueChange={newVoice => onOptionsChange?.({ voice: newVoice })}
        >
          <SelectTrigger className="h-9 rounded-full shadow-none">
            <span className="text-sm">
              {voice ? voice.charAt(0).toUpperCase() + voice.slice(1) : 'Voice'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {availableVoices.map(v => (
              <SelectItem key={v} value={v}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
