'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { generateId } from 'ai';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { UserContent, type Message } from '@/lib/types';
import { isVisionModel } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import { useStore } from '@/store/useStore';
import { ChatHeader } from '@/components/chat-header';
import { EmptyScreen } from '@/components/empty-screen';
import { PromptForm } from '@/components/prompt-form';

export function ChatQuick() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { model, settings } = useSettings();
  const { addChat, setNewChatId } = useStore();

  const isVision = isVisionModel(model);
  const usage = { ...settings, model, prompt: undefined };

  return (
    <>
      <ChatHeader />
      <div className="mb-24 flex size-full flex-col items-center justify-center px-4">
        <EmptyScreen />
        <PromptForm
          className="flex max-w-2xl px-0"
          containerClassName="rounded-xl border"
          textareaClassName="min-h-16"
          isWaiting={true}
          isVision={isVision}
          isLoading={isPending}
          input={input}
          setInput={setInput}
          onSubmit={async (content: UserContent) => {
            startTransition(async () => {
              const messages: Message[] = [
                {
                  id: generateId(),
                  role: 'user',
                  content
                }
              ];
              const result = await api.createChat({
                usage,
                messages
              });
              if (result && 'error' in result) {
                toast.error(result.error);
                return;
              }
              addChat({ ...result, ungenerated: true });
              setNewChatId(result.id);
              router.push(`/chat/${result.id}`);
            });
          }}
        />
      </div>
    </>
  );
}
