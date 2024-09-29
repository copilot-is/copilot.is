'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { SupportedModels } from '@/lib/constant';
import { convertToModelUsage } from '@/lib/convert-to-model-usage';
import { Model } from '@/lib/types';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useSettings } from '@/hooks/use-settings';
import { useStore } from '@/store/useStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { IconClaudeAI, IconGoogleAI, IconOpenAI } from '@/components/ui/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function ModelMenu() {
  const { chatId } = useParams();
  const { chatDetails, updateChatDetail, updateChat } = useStore();
  const { availableModels, model, setModel, modelSettings } = useSettings();
  const [isPending, startTransition] = React.useTransition();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pendingModelValue, setPendingModelValue] = useState<Model | null>(
    null
  );

  const chat = chatDetails[chatId?.toString()];
  const chatModel = chat?.usage?.model;
  const allowedModels = availableModels
    ? SupportedModels.filter(m => availableModels.includes(m.value))
    : SupportedModels;
  const selectedModel = SupportedModels.find(
    m => m.value === (chatModel || model)
  );

  const oldModelInfo = useMemo(
    () => SupportedModels.find(m => m.value === chatModel),
    [chatModel]
  );
  const newModelInfo = useMemo(
    () => SupportedModels.find(m => m.value === pendingModelValue),
    [pendingModelValue]
  );

  const handleModelChange = (value: Model) => {
    if (chatModel && chatModel !== value) {
      setIsAlertOpen(true);
      setPendingModelValue(value);
    } else {
      setModel(value);
    }
  };

  const confirmModelChange = async () => {
    if (pendingModelValue) {
      startTransition(async () => {
        const usage = convertToModelUsage({
          ...modelSettings,
          model: pendingModelValue,
          prompt: undefined
        });
        const result = await api.updateChat(chat.id, { usage });
        if (result && 'error' in result) {
          toast.error(result.error);
          return;
        }
        updateChatDetail(chat.id, { usage });
        updateChat(chat.id, { usage });
        setIsAlertOpen(false);
        setPendingModelValue(null);
      });
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-1 lg:justify-between">
      <Select
        disabled={isPending}
        value={selectedModel?.value}
        onValueChange={handleModelChange}
      >
        <SelectTrigger className="size-auto border-none shadow-none hover:bg-accent data-[state=open]:bg-accent">
          <SelectValue placeholder="Select a model">
            <div className="flex items-center">
              {isPending ? (
                <CircleNotch className="size-4 animate-spin" />
              ) : (
                <>
                  {selectedModel?.provider === 'openai' && <IconOpenAI />}
                  {selectedModel?.provider === 'google' && <IconGoogleAI />}
                  {selectedModel?.provider === 'anthropic' && <IconClaudeAI />}
                </>
              )}
              <span className="ml-2 font-medium">{selectedModel?.text}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align={isMobile ? 'center' : 'start'}>
          {allowedModels.map(model => (
            <SelectItem key={model.value} value={model.value}>
              <div className="flex items-center">
                {model.provider === 'openai' && <IconOpenAI />}
                {model.provider === 'google' && <IconGoogleAI />}
                {model.provider === 'anthropic' && <IconClaudeAI />}
                <div className="ml-2">
                  <div className="font-medium">{model.text}</div>
                  <div className="text-xs text-muted-foreground">
                    {model.value}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the model from{' '}
              <strong>{oldModelInfo?.text}</strong> to{' '}
              <strong>{newModelInfo?.text}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                startTransition(async () => {
                  await confirmModelChange();
                });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
