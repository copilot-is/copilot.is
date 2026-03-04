'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '@/contexts/preferences-context';
import { useSystemSettings } from '@/contexts/system-settings-context';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { Attachment, ChatMessage } from '@/types';
import { CustomUIDataTypes } from '@/types/ui-data';
import { cn, generateUUID, getMostRecentUserMessage } from '@/lib/utils';
import { useChats } from '@/hooks/use-chats';
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom';
import { ChatHeader } from '@/components/chat-header';
import { ChatPromptForm } from '@/components/chat-prompt-form';
import { EmptyScreen } from '@/components/empty-screen';
import { Messages } from '@/components/messages';
import { ModelOptions } from '@/components/model-menu';
import ScrollToBottom from '@/components/scroll-to-bottom';

interface ChatUIProps {
  id: string;
  initialChat?: { title: string; modelId?: string };
  initialMessages?: ChatMessage[];
}

export function ChatUI({ id, initialChat, initialMessages = [] }: ChatUIProps) {
  const { refreshChats } = useChats();

  // Get from contexts
  const { chatModels } = useSystemSettings();
  const { preferences, setPreference } = usePreferences();

  const initialTitle = initialChat?.title;

  const [input, setInput] = useState('');
  const [title, setTitle] = useState(initialTitle);

  // Track the current model (for next submission)
  // Priority: initialChat.modelId (if valid) > preferences
  const [currentModelId, setCurrentModelId] = useState(
    initialChat?.modelId || preferences.chatModelId
  );

  // Track the display model (for showing in Messages)
  const [displayModelId, setDisplayModelId] = useState(
    initialChat?.modelId || preferences.chatModelId
  );

  // Track previous model for rollback on error
  const previousModelRef = useRef<string | null>(null);

  // Track isReasoning state
  const [isReasoning, setIsReasoning] = useState(preferences.chatReasoning);

  // Find current model in database models (for API request options)
  const currentDbModel = useMemo(
    () => chatModels?.find(m => m.modelId === currentModelId),
    [chatModels, currentModelId]
  );

  // Find display model in database models (for showing in Messages)
  const displayDbModel = useMemo(
    () => chatModels?.find(m => m.modelId === displayModelId),
    [chatModels, displayModelId]
  );

  const displayImage = useMemo(
    () => displayDbModel?.image || displayDbModel?.provider?.image || null,
    [displayDbModel]
  );

  const currentImage = useMemo(
    () => currentDbModel?.image || currentDbModel?.provider?.image || null,
    [currentDbModel]
  );

  const supportsReasoning = useMemo(
    () => currentDbModel?.supportsReasoning,
    [currentDbModel]
  );

  const chatRequestBody = useMemo(
    () => ({
      modelId: currentModelId,
      isReasoning: supportsReasoning ? isReasoning : undefined
    }),
    [currentModelId, supportsReasoning, isReasoning]
  );
  const chatRequestBodyRef = useRef(chatRequestBody);

  // Keep ref in sync with the latest request body
  useEffect(() => {
    chatRequestBodyRef.current = chatRequestBody;
  }, [chatRequestBody]);

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
        if (dataPart.type === 'data-chat' && dataPart.data) {
          const chatData = dataPart.data as CustomUIDataTypes['chat'];
          if (chatData.title) {
            if (!title) {
              window.history.replaceState({}, '', `/chat/${id}`);
              refreshChats();
            }
            setTitle(chatData.title);
          }
          // Clear previous model ref on success
          previousModelRef.current = null;
        }
      },
      onError: error => {
        toast.error('An error occurred.', {
          description: error.message
        });
        // Revert displayModel on error
        if (previousModelRef.current) {
          setDisplayModelId(previousModelRef.current);
          previousModelRef.current = null;
        }
      }
    });

  const noChat = useMemo(
    () => !title && status === 'ready' && messages.length === 0,
    [title, status, messages.length]
  );

  // Handle model change from ModelMenu
  const handleModelChange = useCallback(
    (newModelId: string) => {
      setCurrentModelId(newModelId);
      setPreference('chatModelId', newModelId);
    },
    [setPreference]
  );

  // Handle options change from ModelMenu (like reasoning toggle)
  const handleOptionsChange = useCallback(
    (options: ModelOptions) => {
      if (options.isReasoning !== undefined) {
        setIsReasoning(options.isReasoning);
        setPreference('chatReasoning', options.isReasoning);
      }
    },
    [setPreference]
  );

  // Helper to update displayModel optimistically
  const updateDisplayModelOptimistically = useCallback(() => {
    if (currentModelId !== displayModelId) {
      previousModelRef.current = displayModelId;
      setDisplayModelId(currentModelId);
    }
  }, [currentModelId, displayModelId]);

  const handleReload = useCallback(() => {
    updateDisplayModelOptimistically();
    const userMessage = getMostRecentUserMessage(messages);
    regenerate({ body: { parentMessageId: userMessage?.id } });
  }, [messages, regenerate, updateDisplayModelOptimistically]);

  const handleSubmit = useCallback(
    (attachments?: Attachment[]) => {
      if (!input.trim()) return;
      updateDisplayModelOptimistically();
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
    [input, sendMessage, updateDisplayModelOptimistically]
  );

  return (
    <div className="flex size-full flex-col">
      <ChatHeader title={title} />
      <div className="w-full flex-1 overflow-hidden">
        <ScrollToBottom
          className="flex size-full flex-col items-center overflow-y-auto"
          button={<ButtonScrollToBottom status={status} messages={messages} />}
        >
          <Messages
            modelId={displayModelId}
            image={displayImage}
            currentModelId={currentModelId}
            currentImage={currentImage}
            status={status}
            messages={messages}
            setMessages={setMessages}
            reload={handleReload}
            supportsReasoning={supportsReasoning}
          />
        </ScrollToBottom>
      </div>
      <div
        className={cn('mx-auto w-full max-w-4xl bg-background px-4 pb-4', {
          'mb-60 flex h-full flex-col items-center justify-center': noChat
        })}
      >
        {noChat && (
          <EmptyScreen
            icon={<MessageSquare className="mx-auto mb-4 size-12 opacity-50" />}
            text="How can I help you today?"
          />
        )}
        <ChatPromptForm
          modelId={currentModelId}
          stop={stop}
          status={status}
          input={input}
          setInput={setInput}
          onInputChange={e => setInput(e.target.value)}
          onSubmit={handleSubmit}
          onModelChange={handleModelChange}
          onOptionsChange={handleOptionsChange}
        />
      </div>
    </div>
  );
}
