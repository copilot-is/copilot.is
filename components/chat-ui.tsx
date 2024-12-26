'use client';

import { useEffect, useRef, useState } from 'react';
import { generateId } from 'ai';
import { useChat } from 'ai/react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { GenerateTitlePrompt } from '@/lib/constant';
import { env } from '@/lib/env';
import { Chat, UserContent, type AIMessage, type Message } from '@/lib/types';
import {
  apiFromModel,
  formatSystemPrompt,
  getMessageContentText,
  isImageModel,
  isVisionModel,
  providerFromModel
} from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import { useStore } from '@/store/useStore';
import { ChatHeader } from '@/components/chat-header';
import { ChatList } from '@/components/chat-list';
import { PromptForm } from '@/components/prompt-form';

const PRODUCT_NAME = env.NEXT_PUBLIC_PRODUCT_NAME;

interface ChatUIProps {
  chat: Chat;
}

export function ChatUI(props: ChatUIProps) {
  const id = props.chat.id;
  const hasExecutedRef = useRef(false);
  const regenerateIdRef = useRef<string>(undefined);
  const userMessageRef = useRef<Message>(undefined);
  const [isFetching, setIsFetching] = useState(false);
  const { settings, generateTitleModels } = useSettings();
  const { chats, addChat, updateChat, setNewChatId } = useStore();

  const chat = chats[id] || props.chat;
  const title = chat?.title;
  const model = chat?.usage?.model;
  const ungenerated = chat?.ungenerated;
  const isVision = isVisionModel(model);
  const prompt = formatSystemPrompt(model, settings.prompt);
  const provider = providerFromModel(model);

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
    api: apiFromModel(model),
    sendExtraMessageFields: true,
    generateId: () => generateId(),
    body: { ...chat?.usage, stream: true, prompt },
    onError(err) {
      toast.error(err.message);
    },
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
      const result = await api.updateChat({
        id,
        usage: chat?.usage,
        messages: [userMessage, message].filter(Boolean) as Message[],
        regenerateId
      });
      if (result && 'error' in result) {
        toast.error(result.error);
      } else {
        addChat(result);
        if (result.title === 'Untitled') {
          await generateTitle(id, result.messages);
        }
      }
      setIsFetching(false);
    }
  });

  useEffect(() => {
    if (title) {
      document.title = `${title} - ${PRODUCT_NAME}`;
    }
  }, [title]);

  useEffect(() => {
    if (props.chat) {
      addChat(props.chat);
    }
  }, [props.chat, addChat]);

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
        updateChat({ id, ungenerated: undefined });
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
          const result = await api.createAI(
            apiFromModel(genModel),
            genMessages,
            { ...chat?.usage, model: genModel }
          );
          if (result && !('error' in result) && result.content) {
            await api.updateChat({ id, title: result.content });
            updateChat({ id, title: result.content });
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
            id: generateId(),
            role: 'user',
            content,
            createdAt: new Date()
          };
          userMessageRef.current = userMessage as Message;
          await append(userMessage as AIMessage);
        }}
      />
    </>
  );
}
