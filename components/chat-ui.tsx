'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useArtifact } from '@/contexts/artifact-context';
import { usePreferences } from '@/contexts/preferences-context';
import { useSystemSettings } from '@/contexts/system-settings-context';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { Artifact, Attachment, ChatMessage, CustomUIDataTypes } from '@/types';
import { cn, generateUUID, getMostRecentUserMessage } from '@/lib/utils';
import { useChats } from '@/hooks/use-chats';
import { api } from '@/trpc/react';
import { useSidebar } from '@/components/ui/sidebar';
import { ArtifactsPanel } from '@/components/artifacts-panel';
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
  initialArtifacts?: Artifact[];
}

export function ChatUI({
  id,
  initialChat,
  initialMessages = [],
  initialArtifacts = []
}: ChatUIProps) {
  const { refreshChats } = useChats();

  // Get from contexts
  const { chatModels } = useSystemSettings();
  const { preferences, setPreference } = usePreferences();
  const { isMobile, setOpen, setOpenMobile } = useSidebar();

  const initialTitle = initialChat?.title;

  const [input, setInput] = useState('');
  const [title, setTitle] = useState(initialTitle);
  const {
    artifacts,
    activeId,
    isPanelOpen,
    openArtifact,
    setPanelOpen,
    handleStreamPart,
    setArtifactsFromServer
  } = useArtifact();

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
  const previousPanelOpenRef = useRef(isPanelOpen);
  const streamStatusRef = useRef('ready');

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

  const artifactsQuery = api.artifact.list.useQuery(
    { chatId: id },
    {
      initialData: initialArtifacts.map(artifact => ({
        id: artifact.id,
        chatId: artifact.chatId,
        messageId: artifact.messageId,
        title: artifact.title,
        type: artifact.type,
        language: artifact.language ?? null,
        content: artifact.content ?? null,
        fileUrl: artifact.fileUrl ?? null,
        fileName: artifact.fileName ?? null,
        mimeType: artifact.mimeType ?? null,
        size: artifact.size ?? null,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt
      }))
    }
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
        handleStreamPart(dataPart, id);
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
        void artifactsQuery.refetch();
      }
    });

  useEffect(() => {
    streamStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (artifactsQuery.data) {
      setArtifactsFromServer(artifactsQuery.data, {
        preserveStreamingForChatId:
          streamStatusRef.current === 'submitted' ||
          streamStatusRef.current === 'streaming'
            ? id
            : null
      });
    }
  }, [artifactsQuery.data, id, setArtifactsFromServer]);

  useEffect(() => {
    setPanelOpen(false);
  }, [id, setPanelOpen]);

  useEffect(() => {
    if (status === 'ready') {
      artifactsQuery.refetch();
    }
  }, [status, artifactsQuery.refetch]);

  useEffect(() => {
    const wasPanelOpen = previousPanelOpenRef.current;
    previousPanelOpenRef.current = isPanelOpen;

    if (!isPanelOpen || wasPanelOpen) return;

    if (isMobile) {
      setOpenMobile(false);
      return;
    }

    setOpen(false);
  }, [isMobile, isPanelOpen, setOpen, setOpenMobile]);

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

  const handleReload = useCallback(
    (message: ChatMessage) => {
      updateDisplayModelOptimistically();
      const parentMessageId =
        message.role === 'assistant' ? message.metadata?.parentId : message.id;

      regenerate({
        messageId: message.id,
        ...(parentMessageId ? { body: { parentMessageId } } : {})
      });
    },
    [regenerate, updateDisplayModelOptimistically]
  );

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

  const handleArtifactSelect = useCallback(
    (artifactId: string) => {
      openArtifact(artifactId);
    },
    [openArtifact]
  );

  const artifactList = useMemo<Artifact[]>(() => {
    return Object.values(artifacts)
      .filter(artifact => artifact.chatId === id && !!artifact.messageId)
      .map(artifact => {
        return {
          id: artifact.id,
          chatId: artifact.chatId,
          messageId: artifact.messageId!,
          title: artifact.title,
          type: artifact.type,
          language: artifact.language ?? null,
          content: artifact.content,
          fileUrl: artifact.url ?? null,
          fileName: artifact.fileName ?? null,
          mimeType: artifact.mimeType ?? null,
          size: artifact.size ?? null,
          status: artifact.status,
          createdAt: artifact.createdAt ?? new Date(),
          updatedAt: artifact.updatedAt ?? new Date()
        };
      });
  }, [artifacts, id]);

  useEffect(() => {
    if (!isPanelOpen) return;

    if (artifactList.length === 0) {
      setPanelOpen(false);
      return;
    }

    if (activeId && !artifactList.some(artifact => artifact.id === activeId)) {
      setPanelOpen(false);
    }
  }, [activeId, artifactList, isPanelOpen, setPanelOpen]);

  return (
    <div className="flex size-full overflow-hidden">
      <div className="flex w-full flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHeader title={title} />
          <div className="w-full flex-1 overflow-hidden">
            <ScrollToBottom
              className="flex size-full flex-col items-center overflow-y-auto"
              button={
                <ButtonScrollToBottom status={status} messages={messages} />
              }
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
                artifacts={artifactList}
                onSelectArtifact={handleArtifactSelect}
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
                icon={
                  <MessageSquare className="mx-auto mb-4 size-12 opacity-50" />
                }
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
        <ArtifactsPanel
          open={isPanelOpen}
          onOpenChange={setPanelOpen}
          artifacts={artifactList}
          selectedId={activeId}
          onSelect={handleArtifactSelect}
        />
      </div>
    </div>
  );
}
