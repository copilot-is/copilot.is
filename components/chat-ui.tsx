'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat, type Message as AIMessage } from 'ai/react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { GenerateTitlePrompt } from '@/lib/constant';
import { convertToModelUsage } from '@/lib/convert-to-model-usage';
import { UserContent, type Message } from '@/lib/types';
import {
  generateId,
  isImageModel,
  isVisionModel,
  providerFromModel
} from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import { useStore } from '@/store/useStore';
import { ChatHeader } from '@/components/chat-header';
import { ChatList } from '@/components/chat-list';
import { PromptForm } from '@/components/prompt-form';

interface ChatUIProps {
  id: string;
}

export function ChatUI({ id }: ChatUIProps) {
  const messageId = generateId();
  const hasExecutedRef = useRef(false);
  const regenerateIdRef = useRef<string>();
  const userMessageRef = useRef<Message>();
  const [isFetching, setIsFetching] = useState(false);
  const { allowCustomAPIKey, token, modelSettings } = useSettings();
  const {
    chatDetails,
    addChatDetail,
    updateChat,
    updateChatDetail,
    setNewChatId
  } = useStore();

  const chat = chatDetails[id];
  const model = chat?.usage?.model;
  const ungenerated = chat?.ungenerated;
  const isImage = isImageModel(model);
  const isVision = isVisionModel(model);
  const provider = providerFromModel(model);
  const previewToken = allowCustomAPIKey ? token?.[provider] : undefined;
  const usage = convertToModelUsage({
    ...chat?.usage,
    prompt: modelSettings.prompt,
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
    sendExtraMessageFields: true,
    generateId: () => generateId(),
    body: { usage },
    async onResponse(res) {
      if (res.status !== 200) {
        setInput(input);
        const json = await res.json();
        toast.error(json.error);
      }
    },
    async onFinish(message) {
      setIsFetching(true);
      const regenerateId = regenerateIdRef.current;
      const userMessage = userMessageRef.current;

      const result = await api.createChat(
        id,
        usage,
        [userMessage, message].filter(Boolean) as Message[],
        regenerateId
      );
      if (result && 'error' in result) {
        toast.error(result.error);
      } else {
        addChatDetail(result);
        if (result.title === 'Untitled') {
          await generateTitle(id, result.messages);
        }
      }
      setIsFetching(false);
    }
  });

  useEffect(() => {
    if (chat && chat.messages) {
      setMessages(chat.messages as AIMessage[]);
    }
  }, [chat, setMessages]);

  useEffect(() => {
    if (!hasExecutedRef.current) {
      if (
        ungenerated &&
        chat &&
        chat.messages &&
        chat.messages.length === 1 &&
        chat.messages[0].role === 'user'
      ) {
        regenerateIdRef.current = undefined;
        const userMessage = {
          id: chat.messages[0].id,
          role: chat.messages[0].role,
          content: chat.messages[0].content
        };
        userMessageRef.current = userMessage as Message;
        reload();
        updateChatDetail(id, { ungenerated: false });
      }
      hasExecutedRef.current = true;
    }
  });

  const generateTitle = async (id: string, messages: Message[]) => {
    if (id && messages && messages.length >= 2) {
      const genModel = {
        openai: 'gpt-4o-mini',
        google: 'gemini-1.5-flash-latest',
        anthropic: 'claude-3-haiku-20240307'
      };

      const [firstMessage, secondMessage] = messages.slice(0, 2);
      if (firstMessage.role === 'user' && secondMessage.role === 'assistant') {
        const genMessages = [
          {
            role: 'user',
            content: Array.isArray(firstMessage.content)
              ? firstMessage.content
                  .map(c => (c.type === 'text' ? c.text : ''))
                  .join(' ')
              : firstMessage.content
          },
          {
            role: 'assistant',
            content: (Array.isArray(secondMessage.content)
              ? secondMessage.content
                  .map(c => (c.type === 'text' ? c.text : ''))
                  .join(' ')
              : secondMessage.content
            ).replace(/!\[\]\(data:image\/png;base64,.*?\)/g, '')
          },
          { role: 'user', content: GenerateTitlePrompt }
        ];

        const genUsage = convertToModelUsage({
          ...chat?.usage,
          model: genModel[provider],
          prompt: undefined,
          previewToken
        });

        const result = await api.createAI(provider, genMessages, genUsage);
        if (result && !('error' in result)) {
          if (result.content) {
            await api.updateChat(id, { title: result.content });
            updateChat(id, { title: result.content });
            updateChatDetail(id, { title: result.content });
            setNewChatId(id);
          }
        }
      }
    }
  };

  return (
    <>
      <ScrollToBottom
        className="size-full"
        scrollViewClassName="size-full flex flex-col items-center pb-28"
        followButtonClassName="hidden"
        initialScrollBehavior="auto"
      >
        <ChatHeader />
        <ChatList
          id={id}
          isLoading={isLoading || isFetching}
          provider={provider}
          messages={messages as Message[]}
          reload={async () => {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
              regenerateIdRef.current = lastMessage.id;
            }
            await reload();
          }}
        />
      </ScrollToBottom>
      <PromptForm
        className="sticky bottom-0"
        stop={stop}
        isVision={isVision}
        isLoading={isLoading || isFetching}
        input={input}
        setInput={setInput}
        onSubmit={async (content: UserContent) => {
          regenerateIdRef.current = undefined;
          const userMessage = {
            id: messageId,
            role: 'user',
            content
          };
          userMessageRef.current = userMessage as Message;
          await append(userMessage as AIMessage);
        }}
      />
    </>
  );
}
