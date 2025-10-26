'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ScrollToBottom from 'react-scroll-to-bottom';
import { toast } from 'sonner';

import { Attachment, Chat, ChatMessage } from '@/types';
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
import { EmptyScreen } from '@/components/empty-screen';
import { Messages } from '@/components/messages';
import { PromptForm } from '@/components/prompt-form';

const PRODUCT_NAME = env.NEXT_PUBLIC_PRODUCT_NAME;

interface ChatUIProps {
  id: string;
  initialChat?: Pick<Chat, 'title' | 'model'>;
  initialMessages?: ChatMessage[];
}

export function ChatUI({ id, initialChat, initialMessages }: ChatUIProps) {
  const { chatPreferences, setChatPreferences } = useSettings();
  const { isReasoning } = chatPreferences;

  const initialTitle = initialChat?.title;
  const initialModel = initialChat?.model || chatPreferences.model;

  const [title, setTitle] = useState(initialTitle);
  const [model, setModel] = useState(initialModel);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const provider = findModelByValue(model)?.provider;

  const chatRequestBody = useMemo(
    () => ({
      model: selectedModel || chatPreferences.model,
      isReasoning: chatPreferences.isReasoning
    }),
    [selectedModel, chatPreferences]
  );
  const chatRequestBodyRef = useRef(chatRequestBody);

  useEffect(() => {
    chatRequestBodyRef.current = chatRequestBody;
  }, [chatRequestBody]);

  const resetModel = useCallback(
    (newModel: string) => {
      if (model !== selectedModel) {
        setModel(newModel);
        updateChatInCache(id, { model: newModel });
      }
    },
    [id, model, selectedModel]
  );

  const { status, messages, stop, regenerate, setMessages, sendMessage } =
    useChat<ChatMessage>({
      id,
      messages: initialMessages || [],
      experimental_throttle: 100,
      generateId: generateUUID,
      transport: new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest({ messages, body }) {
          const userMessage = getMostRecentUserMessage(messages);
          return {
            body: {
              id,
              message: userMessage,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              ...chatRequestBodyRef.current,
              ...body
            }
          };
        }
      }),
      onData: dataPart => {
        console.log('onData<Client>', dataPart);
        if (dataPart.type === 'data-chat' && dataPart.data) {
          const chatData = dataPart.data;
          const chatTitle = chatData.title;
          const isNewChat = chatData.isNew;

          if (isNewChat) {
            window.history.replaceState({}, '', `/chat/${id}`);
            refreshChats();
          }

          const documentTitle = chatTitle
            ? `${chatTitle} - ${PRODUCT_NAME}`
            : `${initialTitle || 'Untitled'} - ${PRODUCT_NAME}`;
          if (chatTitle && documentTitle !== document.title) {
            document.title = documentTitle;
            setTitle(chatTitle);
          } else if (!chatTitle && initialTitle !== title) {
            setTitle(initialTitle);
          }
        }
      },
      onFinish: ({ message }) => {
        console.log('onFinish<Client>', message);
      },
      onError: error => {
        resetModel(initialModel);
        toast.error('An error occurred.', {
          description: `Oops! An error occurred while processing your request. ${error.message}`
        });
      }
    });

  const noChat = useMemo(
    () => !title && status === 'ready' && messages.length === 0,
    [title, status, messages]
  );

  const handleReload = useCallback(() => {
    resetModel(selectedModel);
    const userMessage = getMostRecentUserMessage(messages);
    regenerate({ body: { parentMessageId: userMessage?.id } });
  }, [messages, selectedModel, regenerate, resetModel]);

  const handleSubmit = useCallback(
    (attachments?: Attachment[]) => {
      if (!input.trim()) return;
      resetModel(selectedModel);
      sendMessage({
        text: input,
        files: attachments?.map(attachment => ({
          type: 'file',
          mediaType: attachment.contentType,
          filename: attachment.name,
          url: attachment.url
        }))
      });
    },
    [input, selectedModel, resetModel, sendMessage]
  );

  return (
    <>
      <div
        className={cn('w-full overflow-hidden', {
          'flex-1': !noChat
        })}
      >
        <ScrollToBottom
          className={cn({ 'size-full': !noChat })}
          scrollViewClassName="size-full flex flex-col items-center"
          followButtonClassName="hidden"
          initialScrollBehavior="auto"
          mode="bottom"
        >
          <ChatHeader title={title} />
          <Messages
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
          onInputChange={e => setInput(e.target.value)}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
