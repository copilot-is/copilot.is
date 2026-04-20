'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import dynamic from 'next/dynamic';
import { usePreferences } from '@/contexts/preferences-context';
import { useSystemSettings } from '@/contexts/system-settings-context';
import { Video as VideoIcon } from 'lucide-react';
import { toast } from 'sonner';

import { ChatMessage } from '@/types';
import { generateVideo } from '@/lib/api';
import { cn, generateUUID } from '@/lib/utils';
import { useChats } from '@/hooks/use-chats';
import { ChatHeader } from '@/components/chat-header';
import { EmptyScreen } from '@/components/empty-screen';
import { Messages } from '@/components/messages';
import { ModelOptions } from '@/components/model-menu';
import { VideoPromptForm } from '@/components/video-prompt-form';

const ScrollToBottom = dynamic(() => import('@/components/scroll-to-bottom'), {
  ssr: false
});

interface VideoUIProps {
  id: string;
  initialChat?: { title: string; modelId?: string };
  initialMessages?: ChatMessage[];
}

export function VideoUI({
  id,
  initialChat,
  initialMessages = []
}: VideoUIProps) {
  const { refreshChats } = useChats();

  // Get from contexts
  const { videoModels } = useSystemSettings();
  const { preferences, setPreference } = usePreferences();

  const initialTitle = initialChat?.title;

  const [input, setInput] = useState('');
  const [title, setTitle] = useState(initialTitle);

  // Track the current model (for next submission)
  // Priority: initialChat.modelId (if valid) > preferences
  const [currentModelId, setCurrentModelId] = useState(
    initialChat?.modelId || preferences.videoModelId
  );

  // Track the display model (for showing in Messages)
  const [displayModelId, setDisplayModelId] = useState(
    initialChat?.modelId || preferences.videoModelId
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

  // Track aspectRatio for video generation
  const [aspectRatio, setAspectRatio] = useState(
    preferences.videoAspectRatio || ''
  );

  // Track resolution for video generation
  const [resolution, setResolution] = useState(
    preferences.videoResolution || ''
  );
  // Track duration for video generation (seconds)
  const [duration, setDuration] = useState<number | undefined>(
    preferences.videoDuration
  );

  // Find current model in database models (for API request options)
  const currentDbModel = useMemo(
    () => videoModels?.find(m => m.modelId === currentModelId),
    [videoModels, currentModelId]
  );

  // Find display model in database models (for showing in Messages)
  const displayDbModel = useMemo(
    () => videoModels?.find(m => m.modelId === displayModelId),
    [videoModels, displayModelId]
  );

  const displayImage = useMemo(
    () => displayDbModel?.image || displayDbModel?.provider?.image || null,
    [displayDbModel]
  );

  const currentImage = useMemo(
    () => currentDbModel?.image || currentDbModel?.provider?.image || null,
    [currentDbModel]
  );

  // Validate and reset aspectRatio/resolution/duration based on the current model's options
  useEffect(() => {
    if (!currentDbModel) return;

    const availableAspectRatios = currentDbModel.uiOptions?.aspectRatios as
      | string[]
      | undefined;
    const defaultAspectRatio = currentDbModel.uiOptions?.aspectRatio as
      | string
      | undefined;
    const availableResolutions = currentDbModel.uiOptions?.resolutions as
      | string[]
      | undefined;
    const defaultResolution = currentDbModel.uiOptions?.resolution as
      | string
      | undefined;
    const availableDurationsRaw = currentDbModel.uiOptions?.durations as
      | Array<number | string>
      | undefined;
    const availableDurations =
      availableDurationsRaw
        ?.map(v => (typeof v === 'number' ? v : Number(v)))
        .filter(v => Number.isFinite(v)) || [];
    const defaultDurationRaw = currentDbModel.uiOptions?.duration as
      | number
      | string
      | undefined;
    const defaultDuration =
      typeof defaultDurationRaw === 'number'
        ? defaultDurationRaw
        : typeof defaultDurationRaw === 'string'
          ? Number(defaultDurationRaw)
          : undefined;

    // Reset aspectRatio if the current aspectRatio is invalid for this model
    if (availableAspectRatios && availableAspectRatios.length > 0) {
      if (!availableAspectRatios.includes(aspectRatio)) {
        const nextAspectRatio = availableAspectRatios.includes(
          preferences.videoAspectRatio
        )
          ? preferences.videoAspectRatio
          : defaultAspectRatio &&
              availableAspectRatios.includes(defaultAspectRatio)
            ? defaultAspectRatio
            : availableAspectRatios[0];
        setAspectRatio(nextAspectRatio);
        setPreference('videoAspectRatio', nextAspectRatio);
      }
    }

    // Reset resolution if the current resolution is invalid for this model
    if (availableResolutions && availableResolutions.length > 0) {
      if (!availableResolutions.includes(resolution)) {
        const nextResolution = availableResolutions.includes(
          preferences.videoResolution
        )
          ? preferences.videoResolution
          : defaultResolution &&
              availableResolutions.includes(defaultResolution)
            ? defaultResolution
            : availableResolutions[0];
        setResolution(nextResolution);
        setPreference('videoResolution', nextResolution);
      }
    }

    // Reset duration if the current duration is invalid for this model
    if (availableDurations.length > 0) {
      if (duration === undefined || !availableDurations.includes(duration)) {
        const nextDuration = availableDurations.includes(
          preferences.videoDuration
        )
          ? preferences.videoDuration
          : defaultDuration !== undefined &&
              availableDurations.includes(defaultDuration)
            ? defaultDuration
            : availableDurations[0];
        setDuration(nextDuration);
        setPreference('videoDuration', nextDuration);
      }
    }
  }, [
    currentDbModel,
    aspectRatio,
    resolution,
    duration,
    preferences.videoAspectRatio,
    preferences.videoDuration,
    preferences.videoResolution,
    setPreference
  ]);

  // Handle model change from ModelMenu
  const handleModelChange = useCallback(
    (newModelId: string) => {
      setCurrentModelId(newModelId);
      setPreference('videoModelId', newModelId);
    },
    [setPreference]
  );

  // Handle options change from ModelMenu
  const handleOptionsChange = (options: ModelOptions) => {
    if (options.aspectRatio !== undefined) {
      setAspectRatio(options.aspectRatio);
      setPreference('videoAspectRatio', options.aspectRatio);
    }
    if (options.resolution !== undefined) {
      setResolution(options.resolution);
      setPreference('videoResolution', options.resolution);
    }
    if (options.duration !== undefined) {
      setDuration(options.duration);
      setPreference('videoDuration', options.duration);
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
      const result = await generateVideo({
        id,
        modelId: currentModelId,
        userMessage,
        aspectRatio,
        resolution,
        duration
      });

      if ('error' in result) {
        toast.error('Video generation failed', {
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
          window.history.replaceState({}, '', `/video/${id}`);
          refreshChats();
        }
        setTitle(result.title);
      }

      // Clear previous model ref on success
      previousModelRef.current = null;

      // Add assistant message with result
      setMessages(prev => [...prev, result.assistantMessage]);
    } catch (error) {
      toast.error('Video generation failed', {
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
      const result = await generateVideo({
        id,
        modelId: currentModelId,
        userMessage,
        parentMessageId: userMessage.id,
        aspectRatio,
        resolution,
        duration
      });

      if ('error' in result) {
        toast.error('Video generation failed', {
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
      toast.error('Video generation failed', {
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
          status={isLoading ? 'submitted' : 'ready'}
          messages={messages}
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
            icon={<VideoIcon className="mx-auto mb-4 size-12 opacity-50" />}
            text="Describe the video you want to generate"
          />
        )}
        <VideoPromptForm
          modelId={currentModelId}
          aspectRatio={aspectRatio}
          duration={duration}
          resolution={resolution}
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
