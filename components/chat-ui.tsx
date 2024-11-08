'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat, type Message as AIMessage } from 'ai/react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { GenerateTitlePrompt } from '@/lib/constant';
import { UserContent, type Message } from '@/lib/types';
import {
  apiFromModel,
  formatSystemPrompt,
  generateId,
  getMessageContentText,
  getProviderConfig,
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
  const { apiCustomEnabled, apiConfigs, settings, generateTitleModels } =
    useSettings();
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
  const isVision = isVisionModel(model);
  const prompt = formatSystemPrompt(model, settings.prompt);
  const provider = providerFromModel(model);
  const customProvider =
    apiCustomEnabled && provider ? apiConfigs?.[provider]?.provider : undefined;
  const config = getProviderConfig(
    apiCustomEnabled,
    provider,
    customProvider,
    apiConfigs
  );

  const usage = {
    ...chat?.usage,
    stream: true,
    prompt
  };

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
    api: apiFromModel(model, customProvider),
    sendExtraMessageFields: true,
    generateId: () => generateId(),
    body: { usage, config },
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
  }, [apiConfigs, chat, setMessages]);

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
        userMessageRef.current = undefined;
      }
      hasExecutedRef.current = true;
    }
  });

  const generateTitle = async (id: string, messages: Message[]) => {
    if (id && messages && messages.length >= 2) {
      const [firstMessage, secondMessage] = messages.slice(0, 2);
      if (firstMessage.role === 'user' && secondMessage.role === 'assistant') {
        const genMessages = [
          {
            role: 'user',
            content: getMessageContentText(firstMessage.content)
          },
          {
            role: 'assistant',
            content: getMessageContentText(secondMessage.content)
          },
          { role: 'user', content: GenerateTitlePrompt }
        ];

        const genModel = (provider && generateTitleModels[provider]) || model;

        if (!isImageModel(genModel)) {
          const genUsage = {
            ...chat?.usage,
            model: genModel,
            prompt: undefined
          };

          const result = await api.createAI(
            apiFromModel(genModel, customProvider),
            genMessages,
            genUsage,
            config
          );
          if (result && !('error' in result) && result.content) {
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
