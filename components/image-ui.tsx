'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { usePreferences } from '@/contexts/preferences-context';
import { useSystemSettings } from '@/contexts/system-settings-context';
import { Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { ChatMessage } from '@/types';
import { generateImage } from '@/lib/api';
import { cn, generateUUID } from '@/lib/utils';
import { useChats } from '@/hooks/use-chats';
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom';
import { ChatHeader } from '@/components/chat-header';
import { EmptyScreen } from '@/components/empty-screen';
import { ImagePromptForm } from '@/components/image-prompt-form';
import { Messages } from '@/components/messages';
import { ModelOptions } from '@/components/model-menu';
import ScrollToBottom from '@/components/scroll-to-bottom';

interface ImageUIProps {
  id: string;
  initialChat?: { title: string; modelId?: string };
  initialMessages?: ChatMessage[];
}

export function ImageUI({
  id,
  initialChat,
  initialMessages = []
}: ImageUIProps) {
  const { refreshChats } = useChats();

  // Get from contexts
  const { imageModels } = useSystemSettings();
  const { preferences, setPreference } = usePreferences();

  const initialTitle = initialChat?.title;

  const [input, setInput] = useState('');
  const [title, setTitle] = useState(initialTitle);

  // Track the current model (for next submission)
  // Priority: initialChat.modelId (if valid) > preferences
  const [currentModelId, setCurrentModelId] = useState(
    initialChat?.modelId || preferences.imageModelId
  );

  // Track the display model (for showing in Messages)
  const [displayModelId, setDisplayModelId] = useState(
    initialChat?.modelId || preferences.imageModelId
  );

  // Track previous model for rollback on error
  const previousModelRef = useRef<string | null>(null);

  // Helper to update displayModel optimistically
  const updateDisplayModelOptimistically = useCallback(() => {
    if (currentModelId !== displayModelId) {
      previousModelRef.current = displayModelId;
      setDisplayModelId(currentModelId);
    }
  }, [currentModelId, displayModelId]);

  const [size, setSize] = useState(preferences.imageSize);
  const [aspectRatio, setAspectRatio] = useState(preferences.imageAspectRatio);
  const [isLoading, setIsLoading] = useState(false);
  const [messagesState, setMessagesState] =
    useState<ChatMessage[]>(initialMessages);
  const messagesRef = useRef<ChatMessage[]>(initialMessages);

  const setMessages = useCallback(
    (updater: React.SetStateAction<ChatMessage[]>) => {
      const nextMessages =
        typeof updater === 'function'
          ? (updater as (prevState: ChatMessage[]) => ChatMessage[])(
              messagesRef.current
            )
          : updater;
      messagesRef.current = nextMessages;
      setMessagesState(nextMessages);
    },
    []
  );

  const messages = messagesState;

  // Find current model in database models (for API request options)
  const currentDbModel = useMemo(
    () => imageModels?.find(m => m.modelId === currentModelId),
    [imageModels, currentModelId]
  );

  // Find display model in database models (for showing in Messages)
  const displayDbModel = useMemo(
    () => imageModels?.find(m => m.modelId === displayModelId),
    [imageModels, displayModelId]
  );

  const displayImage = useMemo(
    () => displayDbModel?.image || displayDbModel?.provider?.image || null,
    [displayDbModel]
  );

  const currentImage = useMemo(
    () => currentDbModel?.image || currentDbModel?.provider?.image || null,
    [currentDbModel]
  );

  const modelOptions = useMemo(
    () => currentDbModel?.uiOptions,
    [currentDbModel]
  );

  // Validate and reset size/aspectRatio based on the current model's options
  useEffect(() => {
    if (!currentDbModel) return;

    const availableSizes = currentDbModel.uiOptions?.sizes as
      | string[]
      | undefined;
    const defaultSize = currentDbModel.uiOptions?.size as string | undefined;
    const availableAspectRatios = currentDbModel.uiOptions?.aspectRatios as
      | string[]
      | undefined;
    const defaultAspectRatio = currentDbModel.uiOptions?.aspectRatio as
      | string
      | undefined;

    // Reset size if the current size is invalid for this model
    if (availableSizes && availableSizes.length > 0) {
      if (!availableSizes.includes(size)) {
        const nextSize = availableSizes.includes(preferences.imageSize)
          ? preferences.imageSize
          : defaultSize && availableSizes.includes(defaultSize)
            ? defaultSize
            : availableSizes[0];
        setSize(nextSize);
        setPreference('imageSize', nextSize);
      }
    }

    // Reset aspectRatio if the current aspectRatio is invalid for this model
    if (availableAspectRatios && availableAspectRatios.length > 0) {
      if (!availableAspectRatios.includes(aspectRatio)) {
        const nextAspectRatio = availableAspectRatios.includes(
          preferences.imageAspectRatio
        )
          ? preferences.imageAspectRatio
          : defaultAspectRatio && availableAspectRatios.includes(defaultAspectRatio)
            ? defaultAspectRatio
            : availableAspectRatios[0];
        setAspectRatio(nextAspectRatio);
        setPreference('imageAspectRatio', nextAspectRatio);
      }
    }
  }, [
    currentDbModel,
    size,
    aspectRatio,
    preferences.imageSize,
    preferences.imageAspectRatio,
    setPreference
  ]);

  // Handle model change from ModelMenu
  const handleModelChange = useCallback(
    (newModelId: string) => {
      setCurrentModelId(newModelId);
      setPreference('imageModelId', newModelId);
    },
    [setPreference]
  );

  const handleSizeChange = (newSize: string) => {
    setSize(newSize);
    setPreference('imageSize', newSize);
  };

  const handleAspectRatioChange = (newAspectRatio: string) => {
    setAspectRatio(newAspectRatio);
    setPreference('imageAspectRatio', newAspectRatio);
  };

  const handleOptionsChange = (options: ModelOptions) => {
    if (options.size !== undefined) {
      handleSizeChange(options.size);
    }
    if (options.aspectRatio !== undefined) {
      handleAspectRatioChange(options.aspectRatio);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setInput('');

    // Create user message
    const now = new Date();
    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      parts: [{ type: 'text', text: input.trim() }],
      metadata: {
        createdAt: now,
        updatedAt: now
      }
    };

    updateDisplayModelOptimistically();

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);

    try {
      const supportSize = modelOptions?.sizes;
      const supportAspectRatio = modelOptions?.aspectRatios;

      const result = await generateImage({
        id,
        modelId: currentModelId,
        userMessage,
        size: supportSize ? size : undefined,
        aspectRatio: supportAspectRatio ? aspectRatio : undefined,
        n: 1
      });

      if ('error' in result) {
        toast.error('Image generation failed', {
          description: result.error
        });
        if (previousModelRef.current) {
          setDisplayModelId(previousModelRef.current);
          previousModelRef.current = null;
        }
        return;
      }

      // Update title and URL
      if (result.title) {
        if (!title) {
          window.history.replaceState({}, '', `/image/${id}`);
          refreshChats();
        }
        setTitle(result.title);
      }

      // Clear previous model ref on success
      previousModelRef.current = null;

      // Add assistant message with result
      setMessages(prev => [...prev, result.assistantMessage]);
    } catch (error) {
      toast.error('Image generation failed', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
      });
      if (previousModelRef.current) {
        setDisplayModelId(previousModelRef.current);
        previousModelRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = async () => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) return;

    // Get the last message
    const lastMessage = currentMessages[currentMessages.length - 1];
    let userMessage: ChatMessage | undefined;
    let shouldRemoveAssistant = false;

    // If last message is assistant, find its parent user message
    if (lastMessage.role === 'assistant') {
      const parentId = lastMessage.metadata?.parentId;
      if (!parentId) return;

      userMessage = currentMessages.find(msg => msg.id === parentId);
      shouldRemoveAssistant = true;
    }
    // If last message is user, use it directly
    else if (lastMessage.role === 'user') {
      userMessage = lastMessage;
    }

    if (!userMessage) return;

    const textParts = userMessage.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n')
      .trim();

    if (!textParts) return;

    setIsLoading(true);

    // Remove the assistant message from UI if needed
    if (shouldRemoveAssistant && lastMessage) {
      setMessages(prev => prev.filter(msg => msg.id !== lastMessage.id));
    }

    updateDisplayModelOptimistically();

    try {
      const supportSize = modelOptions?.sizes;
      const supportAspectRatio = modelOptions?.aspectRatios;

      const result = await generateImage({
        id,
        modelId: currentModelId,
        userMessage,
        parentMessageId: userMessage.id,
        size: supportSize ? size : undefined,
        aspectRatio: supportAspectRatio ? aspectRatio : undefined,
        n: 1
      });

      if ('error' in result) {
        toast.error('Image generation failed', {
          description: result.error
        });
        if (previousModelRef.current) {
          setDisplayModelId(previousModelRef.current);
          previousModelRef.current = null;
        }
        return;
      }

      // Clear previous model ref on success
      previousModelRef.current = null;

      // Add assistant message with result
      setMessages(prev => [...prev, result.assistantMessage]);
    } catch (error) {
      toast.error('Image generation failed', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
      });
      if (previousModelRef.current) {
        setDisplayModelId(previousModelRef.current);
        previousModelRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const noChat = useMemo(
    () => !title && !isLoading && messages.length === 0,
    [title, isLoading, messages.length]
  );

  return (
    <div className="flex size-full flex-col">
      <ChatHeader title={title} />
      <div className="w-full flex-1 overflow-hidden">
        <ScrollToBottom
          className="flex size-full flex-col items-center overflow-y-auto"
          button={
            <ButtonScrollToBottom
              status={isLoading ? 'submitted' : 'ready'}
              messages={messages}
            />
          }
        >
          <Messages
            modelId={displayModelId}
            image={displayImage}
            currentModelId={currentModelId}
            currentImage={currentImage}
            messages={messages}
            setMessages={setMessages}
            reload={handleReload}
            status={isLoading ? 'submitted' : 'ready'}
            isReadonly={false}
          />
        </ScrollToBottom>
      </div>

      <div
        className={cn('mx-auto w-full max-w-4xl px-2 pb-4', {
          'mb-60 flex h-full flex-col items-center justify-center': noChat
        })}
      >
        {noChat && (
          <EmptyScreen
            icon={<ImageIcon className="mx-auto mb-4 size-12 opacity-50" />}
            text="Describe the image you want to generate"
          />
        )}
        <ImagePromptForm
          modelId={currentModelId}
          size={size}
          aspectRatio={aspectRatio}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onModelChange={handleModelChange}
          onOptionsChange={handleOptionsChange}
        />
      </div>
    </div>
  );
}
