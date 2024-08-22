'use client';

import { useRef } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useChat, type Message as AIMessage } from 'ai/react';
import { toast } from 'react-hot-toast';

import { api } from '@/lib/api';
import { GenerateTitlePrompt } from '@/lib/constant';
import { convertToModelUsage } from '@/lib/convert-to-model-usage';
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor';
import { useSettings } from '@/lib/hooks/use-settings';
import { UserContent, type Chat, type Message } from '@/lib/types';
import {
  generateId,
  isImageModel,
  isVisionModel,
  providerFromModel
} from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { ChatHeader } from '@/components/chat-header';
import { ChatList } from '@/components/chat-list';
import { ChatPanel } from '@/components/chat-panel';
import { EmptyScreen } from '@/components/empty-screen';

interface ChatProps {
  id: string;
  chat?: Chat;
}

export function Chat({ id, chat }: ChatProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const messageId = generateId();
  const regenerateIdRef = useRef<string>();
  const { allowCustomAPIKey, model, token, modelSettings } = useSettings();
  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor();
  const { addChat, updateChat, setNewChatId } = useStore();

  const { usage, messages: initialMessages } = chat ?? {};
  const currentUsage = usage
    ? { ...usage, prompt: modelSettings.prompt }
    : { ...modelSettings, model };
  const currentModel = currentUsage.model;
  const isImage = isImageModel(currentModel);
  const isVision = isVisionModel(currentModel);
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
    append,
    reload,
    stop,
    isLoading,
    messages,
    setMessages,
    input,
    setInput
  } = useChat({
    id,
    api: `/api/${isImage ? 'images' : 'chat'}/${provider}`,
    initialMessages: initialMessages as AIMessage[],
    sendExtraMessageFields: true,
    generateId: () => generateId(),
    body: {
      usage: chatUsage
    },
    async onResponse(res) {
      if (res.status !== 200) {
        setInput(input);
        const json = await res.json();
        toast.error(json.error);
      }
    },
    async onFinish(message) {
      const regenerateId = regenerateIdRef.current;
      const userMessage = input
        ? {
            id: messageId,
            role: 'user',
            content: input
          }
        : undefined;
      const chatMessages = [userMessage, message].filter(Boolean) as Message[];
      const chatData = await api.createChat(
        id,
        regenerateId,
        chatUsage,
        chatMessages
      );
      addChat(chatData);
      if (!params.chatId) {
        window.history.pushState({}, '', `/chat/${id}`);
        await generateTitle(id, input, message.content);
        router.refresh();
      }
    }
  });

  const generateTitle = async (id: string, input: string, content: string) => {
    if (id && input && content) {
      const genModel = {
        openai: 'gpt-4o-mini',
        google: 'gemini-1.5-flash-latest',
        anthropic: 'claude-3-haiku-20240307'
      };

      const genMessages = [
        { role: 'user', content: input },
        {
          role: 'assistant',
          content: isImage
            ? content
                .toString()
                .replace(/!\[\]\(data:image\/png;base64,.*?\)/g, '')
            : content.toString()
        },
        { role: 'user', content: GenerateTitlePrompt }
      ];
      const genUsage = convertToModelUsage({
        ...currentUsage,
        model: genModel[provider],
        prompt: undefined,
        previewToken
      });

      const data = await api.createAI(provider, genMessages, genUsage);

      if (data && data.content) {
        await api.updateChat(id, { title: data.content });
        updateChat(id, { title: data.content });
        setNewChatId(id);
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
            isLoading={isLoading}
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
        isVision={isVision}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
        stop={stop}
        append={async (role: string, content: UserContent) => {
          regenerateIdRef.current = undefined;
          await append({ id: messageId, role, content } as AIMessage);
        }}
        reload={async () => {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.role === 'assistant') {
            regenerateIdRef.current = lastMessage.id;
          }

          await reload();
        }}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
    </main>
  );
}
