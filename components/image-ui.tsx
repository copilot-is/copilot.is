'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Image as ImageIcon } from '@phosphor-icons/react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { toast } from 'sonner';

import { ChatMessage, ImageAspectRatio, ImageSize } from '@/types';
import { api } from '@/lib/api';
import { cn, findModelByValue, generateUUID } from '@/lib/utils';
import { refreshChats, updateChatInCache } from '@/hooks/use-chats';
import { useSettings } from '@/hooks/use-settings';
import { ChatHeader } from '@/components/chat-header';
import { EmptyScreen } from '@/components/empty-screen';
import { ImagePromptForm } from '@/components/image-prompt-form';
import { Messages } from '@/components/messages';

interface ImageUIProps {
  id: string;
  initialChat?: { title: string; model: string };
  initialMessages?: ChatMessage[];
}

export function ImageUI({
  id,
  initialChat,
  initialMessages = []
}: ImageUIProps) {
  const { imagePreferences, setImagePreferences } = useSettings();

  const initialTitle = initialChat?.title;
  const initialModel = initialChat?.model || imagePreferences.model;

  const [input, setInput] = useState('');
  const [title, setTitle] = useState(initialTitle);
  const [imageModel, setImageModel] = useState(initialModel);
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [size, setSize] = useState<ImageSize>(imagePreferences.size);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>(
    imagePreferences.aspectRatio
  );
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const provider = useMemo(
    () => findModelByValue('image', imageModel)?.provider,
    [imageModel]
  );

  const modelOptions = useMemo(
    () => findModelByValue('image', selectedModel)?.options,
    [selectedModel]
  );

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    setImagePreferences('model', newModel);

    // Check if the new model supports size or aspectRatio options
    const newModelData = findModelByValue('image', newModel);
    const availableSizes = newModelData?.options?.size;
    const availableAspectRatios = newModelData?.options?.aspectRatio;

    // If model doesn't support size, or current size is not available, reset to first available size
    if (availableSizes && availableSizes.length > 0) {
      if (!availableSizes.includes(size)) {
        const defaultSize = availableSizes[0] as ImageSize;
        setSize(defaultSize);
        setImagePreferences('size', defaultSize);
      }
    }

    // If model doesn't support aspectRatio, or current aspectRatio is not available, reset to first available
    if (availableAspectRatios && availableAspectRatios.length > 0) {
      if (!availableAspectRatios.includes(aspectRatio)) {
        const defaultAspectRatio = availableAspectRatios[0] as ImageAspectRatio;
        setAspectRatio(defaultAspectRatio);
        setImagePreferences('aspectRatio', defaultAspectRatio);
      }
    }
  };

  const handleSizeChange = (newSize: ImageSize) => {
    setSize(newSize);
    setImagePreferences('size', newSize);
  };

  const handleAspectRatioChange = (newAspectRatio: ImageAspectRatio) => {
    setAspectRatio(newAspectRatio);
    setImagePreferences('aspectRatio', newAspectRatio);
  };

  const resetModel = useCallback(
    (newModel: string) => {
      if (imageModel !== selectedModel) {
        setImageModel(newModel);
        updateChatInCache(id, { model: newModel });
      }
    },
    [id, imageModel, selectedModel]
  );

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsLoading(true);

    setInput('');
    resetModel(selectedModel);

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

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);

    try {
      const supportSize = modelOptions?.size;
      const supportAspectRatio = modelOptions?.aspectRatio;

      const result = await api.generateImage({
        id,
        model: selectedModel,
        userMessage,
        size: supportSize ? size : undefined,
        aspectRatio: supportAspectRatio ? aspectRatio : undefined,
        n: 1
      });

      if ('error' in result) {
        toast.error('Image generation failed', {
          description: result.error
        });
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

      // Add assistant message with result
      setMessages(prev => [...prev, result.assistantMessage]);
    } catch (error) {
      toast.error('Image generation failed', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = async () => {
    if (messages.length === 0) return;

    setIsLoading(true);

    // Get the last message
    const lastMessage = messages[messages.length - 1];
    let userMessage: ChatMessage | undefined;
    let shouldRemoveAssistant = false;

    // If last message is assistant, find its parent user message
    if (lastMessage.role === 'assistant') {
      const parentId = lastMessage.metadata?.parentId;
      if (!parentId) return;

      userMessage = messages.find(msg => msg.id === parentId);
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

    // Remove the assistant message from UI if needed
    if (shouldRemoveAssistant) {
      setMessages(prev => prev.slice(0, -1));
    }

    resetModel(selectedModel);

    try {
      const supportSize = modelOptions?.size;
      const supportAspectRatio = modelOptions?.aspectRatio;

      const result = await api.generateImage({
        id,
        model: selectedModel,
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
        return;
      }

      // Add assistant message with result
      setMessages(prev => [...prev, result.assistantMessage]);
    } catch (error) {
      toast.error('Image generation failed', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const noChat = useMemo(
    () => !title && messages.length === 0,
    [title, messages.length]
  );

  return (
    <>
      <div className={cn('w-full overflow-hidden', { 'flex-1': !noChat })}>
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
            messages={messages}
            setMessages={setMessages}
            reload={handleReload}
            status={isLoading ? 'submitted' : 'ready'}
            isReadonly={false}
          />
        </ScrollToBottom>
      </div>

      <div
        className={cn('w-full max-w-4xl px-2 pb-4', {
          'mb-20 flex h-full flex-col items-center justify-center': noChat
        })}
      >
        {noChat && (
          <EmptyScreen
            icon={<ImageIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />}
            text="Describe the image you want to generate"
          />
        )}
        <ImagePromptForm
          model={selectedModel}
          setModel={handleModelChange}
          size={size}
          setSize={handleSizeChange}
          aspectRatio={aspectRatio}
          setAspectRatio={handleAspectRatioChange}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
