'use client';

import { useChat, type Message } from 'ai/react';
import { toast } from 'react-hot-toast';
import { usePathname, useRouter } from 'next/navigation';

import { type Chat } from '@/lib/types';
import {
  messageId,
  isVisionModel,
  providerFromModel,
  buildChatUsage
} from '@/lib/utils';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { ChatList } from '@/components/chat-list';
import { ChatPanel } from '@/components/chat-panel';
import { EmptyScreen } from '@/components/empty-screen';
import { ChatHeader } from '@/components/chat-header';
import { useSettings } from '@/lib/hooks/use-settings';
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor';
import { updateChat } from '@/app/actions';
import { GenerateTitlePrompt } from '@/lib/constant';
import { api } from '@/lib/api';

interface ChatProps {
  id: string;
  chat?: Chat;
}

export function Chat({ id, chat }: ChatProps) {
  const router = useRouter();
  const pathname = usePathname();
  const generateId = messageId();
  const [_, setNewChatId] = useLocalStorage<string>('new-chat-id');
  const { model, token, modelSettings } = useSettings();
  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } = useScrollAnchor();

  const { title, usage, messages: initialMessages } = chat ?? {};
  const currentUsage = usage ? { ...usage, prompt: modelSettings.prompt } : { ...modelSettings, model };
  const currentModel = currentUsage.model;
  const vision = isVisionModel(currentModel);
  const provider = providerFromModel(currentModel);
  const chatUsage = buildChatUsage({
    ...currentUsage,
    stream: true,
    previewToken: undefined // Remove previewToken for security
  });

  const {
    isLoading,
    append,
    reload,
    stop,
    messages,
    setMessages,
    input,
    setInput
  } = useChat({
    id,
    api: '/api/chat/' + provider,
    initialMessages,
    sendExtraMessageFields: true,
    generateId: () => generateId,
    body: {
      id,
      title,
      generateId,
      usage: chatUsage
    },
    async onResponse(response) {
      if (response.status !== 200) {
        setInput(input);
        const json = await response.json();
        toast.error(json.message);
      }
    },
    async onFinish(message) {
      if (!pathname.includes('chat')) {
        window.history.pushState({}, '', `/chat/${id}`);
        await generateTitle(id, input, message);
        setNewChatId(id);
        router.refresh();
      }
    }
  });

  const generateTitle = async (id: string, input: string, message: Message) => {
    const genModel = {
      openai: 'gpt-4',
      google: 'gemini-1.5-pro',
      anthropic: 'claude-3-haiku-20240307'
    };
    const genMessages = [
      { role: 'user', content: input },
      { role: message.role, content: message.content },
      {
        role: 'user',
        content: GenerateTitlePrompt
      }
    ] as Message[];
    const genUsage = buildChatUsage({
      ...currentUsage,
      model: genModel[provider],
      prompt: undefined,
    });

    const data = await api.createChat(provider, {
      messages: genMessages,
      usage: genUsage
    });

    if (data.length && data[0]?.content) {
      await updateChat(id, { title: data[0]?.content });
    }
  };

  return (
    <main
      className="group flex size-full flex-col overflow-auto pl-0 duration-300 ease-in-out peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      ref={scrollRef}
    >
      <ChatHeader chat={chat} />
      <div className="flex-1 pb-36 pt-16 lg:pb-40 xl:pt-20" ref={messagesRef}>
        {messages.length ? (
          <ChatList
            id={id}
            provider={provider}
            messages={messages}
            setMessages={setMessages}
          />
        ) : (
          <EmptyScreen provider={provider} setInput={setInput} />
        )}
        <div className="h-px w-full" ref={visibilityRef} />
      </div>
      <ChatPanel
        chat={chat}
        vision={vision}
        messages={messages}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
    </main>
  )
}