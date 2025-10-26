'use client';

import * as React from 'react';
import { UseChatHelpers } from '@ai-sdk/react';

import { ChatMessage, Provider } from '@/types';
import { cn } from '@/lib/utils';
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom';
import { Message } from '@/components/message';
import { MessageActions } from '@/components/message-actions';
import { MessageLoading } from '@/components/message-loading';

export interface MessagesProps
  extends Partial<Pick<UseChatHelpers<ChatMessage>, 'status' | 'setMessages'>>,
    Pick<UseChatHelpers<ChatMessage>, 'messages'> {
  model: string;
  provider?: Provider;
  reload?: () => void;
  isReasoning?: boolean;
  isReadonly?: boolean;
  className?: string;
}

export function Messages({
  model,
  provider,
  status,
  reload,
  messages,
  setMessages,
  isReasoning,
  isReadonly,
  className
}: MessagesProps) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className={cn('mx-auto w-full max-w-4xl flex-1 p-4', className)}>
      {messages.map((message: any, index: number) => {
        const isLastMessage = index === messages.length - 1;
        return (
          <Message
            key={index}
            status={status}
            message={message}
            provider={provider}
            isLastMessage={isLastMessage}
            isReasoning={isReasoning}
          >
            <MessageActions
              model={model}
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

      {status === 'submitted' && <MessageLoading provider={provider} />}
      <ButtonScrollToBottom status={status} messages={messages} />
    </div>
  );
}
