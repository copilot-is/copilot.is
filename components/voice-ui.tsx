'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Microphone } from '@phosphor-icons/react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { toast } from 'sonner';

import { ChatMessage, Voice } from '@/types';
import { api } from '@/lib/api';
import { cn, findModelByValue, generateUUID } from '@/lib/utils';
import { refreshChats, updateChatInCache } from '@/hooks/use-chats';
import { useSettings } from '@/hooks/use-settings';
import { ChatHeader } from '@/components/chat-header';
import { EmptyScreen } from '@/components/empty-screen';
import { Messages } from '@/components/messages';
import { VoicePromptForm } from '@/components/voice-prompt-form';

interface VoiceUIProps {
  id: string;
  initialChat?: { title: string; model: string };
  initialMessages?: ChatMessage[];
}

export function VoiceUI({
  id,
  initialChat,
  initialMessages = []
}: VoiceUIProps) {
  const { voicePreferences, setVoicePreferences } = useSettings();

  const initialTitle = initialChat?.title;
  const initialModel = initialChat?.model || voicePreferences.model;

  const [input, setInput] = useState('');
  const [title, setTitle] = useState(initialTitle);
  const [voiceModel, setVoiceModel] = useState(initialModel);
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [voice, setVoice] = useState<Voice>(voicePreferences.voice);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const provider = useMemo(
    () => findModelByValue('voice', voiceModel)?.provider,
    [voiceModel]
  );

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    setVoicePreferences('model', newModel);
  };

  const handleVoiceChange = (newVoice: Voice) => {
    setVoice(newVoice);
    setVoicePreferences('voice', newVoice);
  };

  const resetModel = useCallback(
    (newModel: string) => {
      if (voiceModel !== selectedModel) {
        setVoiceModel(newModel);
        updateChatInCache(id, { model: newModel });
      }
    },
    [id, voiceModel, selectedModel]
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
      const result = await api.generateVoice({
        id,
        model: selectedModel,
        userMessage,
        voice
      });

      if ('error' in result) {
        toast.error('Voice generation failed', {
          description: result.error
        });
        return;
      }

      // Update title and URL
      if (result.title) {
        if (!title) {
          window.history.replaceState({}, '', `/voice/${id}`);
          refreshChats();
        }
        setTitle(result.title);
      }

      // Add assistant message with result
      setMessages(prev => [...prev, result.assistantMessage]);
    } catch (error) {
      toast.error('Voice generation failed', {
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
      const result = await api.generateVoice({
        id,
        model: selectedModel,
        userMessage,
        parentMessageId: userMessage.id,
        voice
      });

      if ('error' in result) {
        toast.error('Voice generation failed', {
          description: result.error
        });
        return;
      }

      // Add assistant message with result
      setMessages(prev => [...prev, result.assistantMessage]);
    } catch (error) {
      toast.error('Voice generation failed', {
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
            icon={<Microphone className="mx-auto mb-4 h-12 w-12 opacity-50" />}
            text="Enter text to convert to speech"
          />
        )}
        <VoicePromptForm
          model={selectedModel}
          setModel={handleModelChange}
          voice={voice}
          setVoice={handleVoiceChange}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
