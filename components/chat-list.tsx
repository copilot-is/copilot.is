'use client';

import * as React from 'react';
import { UseChatHelpers } from '@ai-sdk/react';

import { Provider } from '@/types';
import { cn } from '@/lib/utils';
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom';
import { ChatMessage } from '@/components/chat-message';
import { ChatMessageActions } from '@/components/chat-message-actions';
import { ChatMessageLoading } from '@/components/chat-message-loading';

export interface ChatListProps
  extends Partial<Pick<UseChatHelpers, 'status' | 'reload' | 'setMessages'>>,
    Pick<UseChatHelpers, 'messages'> {
  model: string;
  provider?: Provider;
  isReasoning?: boolean;
  isReadonly?: boolean;
  className?: string;
}

export function ChatList({
  model,
  provider,
  status,
  reload,
  messages,
  setMessages,
  isReasoning,
  isReadonly,
  className
}: ChatListProps) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className={cn('mx-auto w-full max-w-4xl flex-1 p-4', className)}>
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        return (
          <ChatMessage
            key={index}
            status={status}
            message={message}
            provider={provider}
            isReasoning={isReasoning}
          >
            <ChatMessageActions
              model={model}
              status={status}
              reload={reload}
              message={message}
              setMessages={setMessages}
              isLastMessage={isLastMessage}
              isReadonly={isReadonly}
            />
          </ChatMessage>
        );
      })}

      {status === 'submitted' && <ChatMessageLoading provider={provider} />}
      <ButtonScrollToBottom />
    </div>
  );
}
