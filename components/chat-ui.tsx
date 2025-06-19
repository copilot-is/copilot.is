'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Message, useChat, UseChatOptions } from '@ai-sdk/react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { toast } from 'sonner';

import { Chat } from '@/types';
import { env } from '@/lib/env';
import {
  cn,
  findModelByValue,
  generateUUID,
  getMostRecentUserMessage
} from '@/lib/utils';
import { refreshChats, updateChatInCache } from '@/hooks/use-chats';
import { useSettings } from '@/hooks/use-settings';
import { ChatHeader } from '@/components/chat-header';
import { ChatList } from '@/components/chat-list';
import { EmptyScreen } from '@/components/empty-screen';
import { PromptForm } from '@/components/prompt-form';

const PRODUCT_NAME = env.NEXT_PUBLIC_PRODUCT_NAME;

interface ChatUIProps {
  id?: string;
  initialChat?: Chat;
}

export function ChatUI({ id, initialChat }: ChatUIProps) {
  const router = useRouter();

  const { chatPreferences, setChatPreferences } = useSettings();
  const { isReasoning } = chatPreferences;

  const initialTitle = initialChat?.title;
  const initialModel = initialChat?.model || chatPreferences.model;
  const initialMessages = initialChat?.messages;

  const [title, setTitle] = useState(initialTitle);
  const [model, setModel] = useState(initialModel);
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const provider = findModelByValue(model)?.provider;
  const setParentIdRef = useRef<(message: Message) => void>(() => {});

  const resetModel = useCallback(
    (newModel: string) => {
      if (id && model !== selectedModel) {
        setModel(newModel);
        updateChatInCache(id, { model: newModel });
      }
    },
    [id, model, selectedModel]
  );

  const chatOptions: UseChatOptions = useMemo(
    () => ({
      id,
      initialMessages,
      maxSteps: 5,
      experimental_throttle: 200,
      sendExtraMessageFields: true,
      body: { ...chatPreferences, model: selectedModel },
      generateId: generateUUID,
      onResponse: async res => {
        if (res.status !== 200) {
          resetModel(initialModel);
          const json = await res.json();
          toast.error(json.error);
        }
      },
      onFinish: message => {
        setParentIdRef.current(message);
      },
      onError: error => {
        resetModel(initialModel);
        toast.error('An error occurred.', {
          description: `Oops! An error occurred while processing your request. ${error.message}`
        });
      }
    }),
    [
      id,
      initialModel,
      initialMessages,
      selectedModel,
      chatPreferences,
      resetModel
    ]
  );

  const {
    stop,
    reload,
    status,
    data,
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit
  } = useChat(chatOptions);

  const noChat = useMemo(
    () => !id && !initialChat && messages.length === 0,
    [initialChat, messages.length]
  );

  useEffect(() => {
    const chatData = data?.[0] as { id: string; title: string };
    const chatId = chatData?.id;
    const chatTitle = chatData?.title;

    if (!id && chatId) {
      router.replace(`/chat/${chatId}`, { scroll: false });
      refreshChats();
    }

    const documentTitle = `${chatTitle} - ${PRODUCT_NAME}`;
    if (chatTitle && documentTitle !== document.title) {
      document.title = documentTitle;
      setTitle(chatTitle);
    } else if (!chatTitle && initialTitle !== title) {
      setTitle(initialTitle);
    }
  }, [id, initialTitle, data, router]);

  useEffect(() => {
    setParentIdRef.current = (message: Message) => {
      setMessages(messages => {
        const userMessage = getMostRecentUserMessage(messages);
        return userMessage
          ? messages.map(m =>
              m.id === message.id ? { ...message, parentId: userMessage.id } : m
            )
          : messages;
      });
    };
  }, [setMessages]);

  const handleReload = useCallback(() => {
    resetModel(selectedModel);
    const userMessage = getMostRecentUserMessage(messages);
    return reload({
      body: { parentMessageId: userMessage?.id }
    });
  }, [messages, selectedModel, reload, resetModel]);

  return (
    <>
      <div
        className={cn('w-full overflow-hidden', {
          'flex-1': !noChat
        })}
      >
        <ScrollToBottom
          className="size-full"
          scrollViewClassName="size-full flex flex-col items-center"
          followButtonClassName="hidden"
          initialScrollBehavior="auto"
        >
          <ChatHeader title={title} />
          <ChatList
            model={selectedModel}
            provider={provider}
            status={status}
            messages={messages}
            setMessages={setMessages}
            reload={handleReload}
            isReasoning={isReasoning}
          />
        </ScrollToBottom>
      </div>
      <div
        className={cn('w-full max-w-4xl bg-background px-2 pb-4', {
          'mb-20 flex h-full flex-col items-center justify-center': noChat
        })}
      >
        {noChat && <EmptyScreen />}
        <PromptForm
          model={selectedModel}
          setModel={value => {
            setSelectedModel(value);
            setChatPreferences('model', value);
          }}
          stop={stop}
          status={status}
          input={input}
          setInput={setInput}
          onInputChange={handleInputChange}
          onSubmit={(e, attachments) => {
            resetModel(selectedModel);
            handleSubmit(e, {
              experimental_attachments: attachments
            });
          }}
        />
      </div>
    </>
  );
}
