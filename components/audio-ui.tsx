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
import { Mic } from 'lucide-react';
import { toast } from 'sonner';

import { ChatMessage } from '@/types';
import { generateVoice } from '@/lib/api';
import { cn, generateUUID } from '@/lib/utils';
import { useChats } from '@/hooks/use-chats';
import { AudioPromptForm } from '@/components/audio-prompt-form';
import { ChatHeader } from '@/components/chat-header';
import { EmptyScreen } from '@/components/empty-screen';
import { Messages } from '@/components/messages';
import { ModelOptions } from '@/components/model-menu';

const ScrollToBottom = dynamic(() => import('@/components/scroll-to-bottom'), {
  ssr: false
});

interface AudioUIProps {
  id: string;
  initialChat?: { title: string; modelId?: string };
  initialMessages?: ChatMessage[];
}

export function AudioUI({
  id,
  initialChat,
  initialMessages = []
}: AudioUIProps) {
  const { refreshChats } = useChats();

  // Get from contexts
  const { ttsModels: audioModels } = useSystemSettings();
  const { preferences, setPreference } = usePreferences();

  const initialTitle = initialChat?.title;

  const [input, setInput] = useState('');
  const [title, setTitle] = useState(initialTitle);

  // Track the current model (for next submission)
  // Priority: initialChat.modelId (if valid) > preferences
  const [currentModelId, setCurrentModelId] = useState(
    initialChat?.modelId || preferences.audioModelId
  );

  // Track the display model (for showing in Messages)
  const [displayModelId, setDisplayModelId] = useState(
    initialChat?.modelId || preferences.audioModelId
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

  const [voice, setVoice] = useState(preferences.audioVoice);
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
    () => audioModels?.find(m => m.modelId === currentModelId),
    [audioModels, currentModelId]
  );

  // Find display model in database models (for showing in Messages)
  const displayDbModel = useMemo(
    () => audioModels?.find(m => m.modelId === displayModelId),
    [audioModels, displayModelId]
  );

  const displayImage = useMemo(
    () => displayDbModel?.image || displayDbModel?.provider?.image || null,
    [displayDbModel]
  );

  const currentImage = useMemo(
    () => currentDbModel?.image || currentDbModel?.provider?.image || null,
    [currentDbModel]
  );

  // Validate and reset voice based on the current model's options
  useEffect(() => {
    if (!currentDbModel) return;

    const uiOptions = currentDbModel.uiOptions as Record<
      string,
      unknown
    > | null;
    const availableVoices = (uiOptions?.voices as string[] | undefined) || [];
    const defaultVoice = uiOptions?.voice as string | undefined;

    // Reset voice if the current voice is invalid for this model
    if (availableVoices.length > 0 && !availableVoices.includes(voice)) {
      const nextVoice = availableVoices.includes(preferences.audioVoice)
        ? preferences.audioVoice
        : defaultVoice && availableVoices.includes(defaultVoice)
          ? defaultVoice
          : availableVoices[0];
      setVoice(nextVoice);
      setPreference('audioVoice', nextVoice);
    }
  }, [currentDbModel, voice, preferences.audioVoice, setPreference]);

  // Handle model change from ModelMenu
  const handleModelChange = useCallback(
    (newModelId: string) => {
      setCurrentModelId(newModelId);
      setPreference('audioModelId', newModelId);
    },
    [setPreference]
  );

  const handleVoiceChange = (newVoice: string) => {
    setVoice(newVoice);
    setPreference('audioVoice', newVoice);
  };

  const handleOptionsChange = (options: ModelOptions) => {
    if (options.voice !== undefined) {
      handleVoiceChange(options.voice);
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
      const result = await generateVoice({
        id,
        modelId: currentModelId,
        userMessage,
        voice
      });

      if ('error' in result) {
        toast.error('Audio generation failed', {
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
          window.history.replaceState({}, '', `/audio/${id}`);
          refreshChats();
        }
        setTitle(result.title);
      }

      // Clear previous model ref on success
      previousModelRef.current = null;

      // Add assistant message with result
      setMessages(prev => [...prev, result.assistantMessage]);
    } catch (error) {
      toast.error('Audio generation failed', {
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
      const result = await generateVoice({
        id,
        modelId: currentModelId,
        userMessage,
        parentMessageId: userMessage.id,
        voice
      });

      if ('error' in result) {
        toast.error('Audio generation failed', {
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
      toast.error('Audio generation failed', {
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
            icon={<Mic className="mx-auto mb-4 size-12 opacity-50" />}
            text="Enter text to convert to speech"
          />
        )}
        <AudioPromptForm
          modelId={currentModelId}
          voice={voice}
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
