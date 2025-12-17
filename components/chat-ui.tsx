'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { ChatDots } from '@phosphor-icons/react';
import { DefaultChatTransport } from 'ai';
import ScrollToBottom from 'react-scroll-to-bottom';
import { toast } from 'sonner';

import { Attachment, Chat, ChatMessage } from '@/types';
import { CustomUIDataTypes } from '@/types/ui-data';
import {
  cn,
  findModelByValue,
  generateUUID,
  getMostRecentUserMessage
} from '@/lib/utils';
import { refreshChats, updateChatInCache } from '@/hooks/use-chats';
import { useSettings } from '@/hooks/use-settings';
import { ChatHeader } from '@/components/chat-header';
import { ChatPromptForm } from '@/components/chat-prompt-form';
import { EmptyScreen } from '@/components/empty-screen';
import { Messages } from '@/components/messages';

interface ChatUIProps {
  id: string;
  initialChat?: Pick<Chat, 'title' | 'model'>;
  initialMessages?: ChatMessage[];
}

export function ChatUI({ id, initialChat, initialMessages = [] }: ChatUIProps) {
  const { chatPreferences, setChatPreferences } = useSettings();

  const initialTitle = initialChat?.title;
  const initialModel = initialChat?.model || chatPreferences.model;

  const [input, setInput] = useState('');
  const [title, setTitle] = useState(initialTitle);
  const [chatModel, setChatModel] = useState(initialModel);
  const [selectedModel, setSelectedModel] = useState(initialModel);

  const provider = useMemo(
    () => findModelByValue('chat', chatModel)?.provider,
    [chatModel]
  );

  const isReasoning = useMemo(
    () => findModelByValue('chat', selectedModel)?.options?.isReasoning,
    [selectedModel]
  );

  const chatRequestBody = useMemo(
    () => ({
      model: selectedModel || chatPreferences.model,
      isReasoning: isReasoning ? chatPreferences.isReasoning : undefined
    }),
    [selectedModel, isReasoning, chatPreferences]
  );
  const chatRequestBodyRef = useRef(chatRequestBody);

  useEffect(() => {
    chatRequestBodyRef.current = chatRequestBody;
  }, [chatRequestBody]);

  const resetModel = useCallback(
    (newModel: string) => {
      if (chatModel !== selectedModel) {
        setChatModel(newModel);
        updateChatInCache(id, { model: newModel });
      }
    },
    [id, chatModel, selectedModel]
  );

  const { status, messages, stop, regenerate, setMessages, sendMessage } =
    useChat<ChatMessage>({
      id,
      messages: initialMessages,
      experimental_throttle: 100,
      generateId: generateUUID,
      transport: new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest({ messages, body }) {
          const userMessage = getMostRecentUserMessage(messages);
          return {
            body: {
              id,
              userMessage,
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
          const chatData = dataPart.data as CustomUIDataTypes['chat'];
          if (chatData.title) {
            if (!title) {
              window.history.replaceState({}, '', `/chat/${id}`);
              refreshChats();
            }
            setTitle(chatData.title);
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
    [title, status, messages.length]
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
          />
        </ScrollToBottom>
      </div>
      <div
        className={cn('w-full max-w-4xl bg-background px-2 pb-4', {
          'mb-20 flex h-full flex-col items-center justify-center': noChat
        })}
      >
        {noChat && (
          <EmptyScreen
            icon={<ChatDots className="mx-auto mb-4 size-12 opacity-50" />}
            text="How can I help you today?"
          />
        )}
        <ChatPromptForm
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
