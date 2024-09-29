'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { convertToModelUsage } from '@/lib/convert-to-model-usage';
import { UserContent, type Message } from '@/lib/types';
import { generateId, isVisionModel } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import { useStore } from '@/store/useStore';
import { ChatHeader } from '@/components/chat-header';
import { EmptyScreen } from '@/components/empty-screen';
import { PromptForm } from '@/components/prompt-form';

interface ChatUIProps {
  id: string;
}

export function ChatQuick({ id }: ChatUIProps) {
  const router = useRouter();
  const messageId = generateId();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { model, modelSettings } = useSettings();
  const { addChat, addChatDetail, setNewChatId } = useStore();

  const usage = convertToModelUsage({ ...modelSettings, model });
  const isVision = isVisionModel(usage.model);

  return (
    <>
      <ChatHeader />
      <EmptyScreen />
      <PromptForm
        className="flex max-w-2xl"
        containerClassName="rounded-xl border"
        isVision={isVision}
        isLoading={isLoading}
        input={input}
        setInput={setInput}
        onSubmit={async (content: UserContent) => {
          setIsLoading(true);
          const userMessage: Message = {
            id: messageId,
            role: 'user',
            content
          };
          const result = await api.createChat(id, usage, [userMessage]);
          if (result && 'error' in result) {
            toast.error(result.error);
            return;
          }
          addChat(result);
          addChatDetail({ ...result, ungenerated: true });
          setNewChatId(result.id);
          router.push(`/chat/${result.id}`);
          setIsLoading(false);
        }}
      />
    </>
  );
}
