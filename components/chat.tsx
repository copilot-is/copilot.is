'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useChat, type Message as AIMessage } from 'ai/react';
import { toast } from 'react-hot-toast';

import { api } from '@/lib/api';
import { GenerateTitlePrompt } from '@/lib/constant';
import { convertToModelUsage } from '@/lib/convert-to-model-usage';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor';
import { useSettings } from '@/lib/hooks/use-settings';
import { type Chat, type Message } from '@/lib/types';
import {
  isImageModel,
  isVisionModel,
  messageId,
  providerFromModel
} from '@/lib/utils';
import { ChatHeader } from '@/components/chat-header';
import { ChatList } from '@/components/chat-list';
import { ChatPanel } from '@/components/chat-panel';
import { EmptyScreen } from '@/components/empty-screen';
import { updateChat } from '@/app/actions';

interface ChatProps {
  id: string;
  chat?: Chat;
}

export function Chat({ id, chat }: ChatProps) {
  const router = useRouter();
  const pathname = usePathname();
  const generateId = messageId();
  const [_, setNewChatId] = useLocalStorage<string>('new-chat-id');
  const { allowCustomAPIKey, model, token, modelSettings } = useSettings();
  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor();

  const { title, usage, messages: initialMessages } = chat ?? {};
  const currentUsage = usage
    ? { ...usage, prompt: modelSettings.prompt }
    : { ...modelSettings, model };
  const currentModel = currentUsage.model;
  const image = isImageModel(currentModel);
  const vision = isVisionModel(currentModel);
  const provider = providerFromModel(currentModel);
  const previewToken = allowCustomAPIKey
    ? token?.[provider] || undefined
    : undefined;
  const chatUsage = convertToModelUsage({
    ...currentUsage,
    stream: true,
    previewToken
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
    api: `/api/${image ? 'images' : 'chat'}/${provider}`,
    initialMessages: initialMessages as AIMessage[],
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

  const generateTitle = async (
    id: string,
    input: string,
    message: AIMessage
  ) => {
    const genModel = {
      openai: 'gpt-3.5-turbo',
      google: 'gemini-pro',
      anthropic: 'claude-3-haiku-20240307'
    };
    const content = image
      ? message.content
          .toString()
          .replace(/!\[\]\(data:image\/png;base64,.*?\)/g, '')
      : message.content.toString();

    if (content) {
      const genMessages = [
        { role: 'user', content: input },
        {
          role: message.role,
          content
        },
        {
          role: 'user',
          content: GenerateTitlePrompt
        }
      ] as Message[];
      const genUsage = convertToModelUsage({
        ...currentUsage,
        model: genModel[provider],
        prompt: undefined,
        previewToken
      });

      const data = await api.createChat(provider, {
        messages: genMessages,
        usage: genUsage
      });

      if (data && data.content) {
        await updateChat(id, { title: data.content });
      }
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
            messages={messages as Message[]}
            setMessages={messages => {
              setMessages(messages as AIMessage[]);
            }}
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
  );
}
