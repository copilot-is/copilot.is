'use client';

import * as React from 'react';
import { UseChatHelpers } from '@ai-sdk/react';

import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { Message } from '@/components/message';
import { MessageActions } from '@/components/message-actions';
import { MessageLoading } from '@/components/message-loading';

export interface MessagesProps
  extends Partial<Pick<UseChatHelpers<ChatMessage>, 'status' | 'setMessages'>>,
    Pick<UseChatHelpers<ChatMessage>, 'messages'> {
  /** Display model (for existing messages) */
  modelId: string;
  /** Display image (for existing messages) */
  image?: string | null;
  /** Current selected model (for regenerate) */
  currentModelId?: string;
  /** Current image (for loading) */
  currentImage?: string | null;
  reload?: () => void;
  isReadonly?: boolean;
  supportsReasoning?: boolean | null;
  className?: string;
}

export function Messages({
  modelId,
  image,
  currentModelId,
  currentImage,
  status,
  reload,
  messages,
  setMessages,
  isReadonly,
  supportsReasoning,
  className
}: MessagesProps) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className={cn('mx-auto w-full max-w-4xl flex-1 px-4 py-6', className)}>
      {messages.map((message: ChatMessage, index: number) => {
        const isLastMessage = index === messages.length - 1;
        return (
          <Message
            key={index}
            status={status}
            message={message}
            image={image}
            isLastMessage={isLastMessage}
            supportsReasoning={supportsReasoning}
          >
            <MessageActions
              modelId={currentModelId || modelId}
              status={status}
              reload={reload}
              message={message}
              setMessages={setMessages}
              isLastMessage={isLastMessage}
              isReadonly={isReadonly}
            />
          </Message>
        );
      })}

      {status === 'submitted' && (
        <MessageLoading image={currentImage || image} />
      )}
    </div>
  );
}
