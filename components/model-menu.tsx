'use client';

import * as React from 'react';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { SupportedModels } from '@/lib/constant';
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
import {
  IconClaudeAI,
  IconGoogleAI,
  IconGork,
  IconOpenAI
} from '@/components/ui/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function ModelMenu() {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const { chatId } = useParams();
  const { chatDetails, updateChatDetail, updateChat } = useStore();
  const { availableModels, model, setModel, settings } = useSettings();
  const [isPending, startTransition] = React.useTransition();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [newModel, setNewModel] = useState('');

  const chat = chatDetails[chatId?.toString()];
  const chatModel = chat?.usage?.model;
  const selectedModel = SupportedModels.find(
    m => m.value === (chatModel || model)
  );

  const handleModelChange = (value: string) => {
    if (chatModel && chatModel !== value) {
      setIsAlertOpen(true);
      setNewModel(value);
    } else {
      setModel(value);
    }
  };

  const confirmModelChange = async () => {
    if (newModel) {
      startTransition(async () => {
        const usage = {
          ...settings,
          model: newModel,
          prompt: undefined
        };
        const result = await api.updateChat(chat.id, { usage });
        if (result && 'error' in result) {
          toast.error(result.error);
          return;
        }
        updateChat(chat.id, { usage });
        updateChatDetail(chat.id, { usage });
        setIsAlertOpen(false);
        setNewModel('');
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
        <SelectTrigger className="size-auto border-none shadow-none hover:bg-accent data-[state=open]:bg-accent [&>svg]:size-3">
          <SelectValue placeholder="Select a model">
            <div className="flex items-center">
              {selectedModel?.provider === 'openai' && <IconOpenAI />}
              {selectedModel?.provider === 'google' && <IconGoogleAI />}
              {selectedModel?.provider === 'anthropic' && <IconClaudeAI />}
              {selectedModel?.provider === 'xai' && <IconGork />}
              <span className="ml-2 font-medium">{selectedModel?.text}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align={isMobile ? 'center' : 'start'}>
          {availableModels.map(model => (
            <SelectItem key={model.value} value={model.value}>
              <div className="flex items-center">
                {model.provider === 'openai' && <IconOpenAI />}
                {model.provider === 'google' && <IconGoogleAI />}
                {model.provider === 'anthropic' && <IconClaudeAI />}
                {model.provider === 'xai' && <IconGork />}
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
              <strong>{selectedModel?.value}</strong> to{' '}
              <strong>{newModel}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={e => {
                e.preventDefault();
                startTransition(async () => {
                  await confirmModelChange();
                });
              }}
            >
              {isPending ? (
                <>
                  <CircleNotch className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
