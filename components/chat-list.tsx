'use client';

import * as React from 'react';

import { Message, Provider } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { IconTyping } from '@/components/ui/icons';
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom';
import { ChatMessage } from '@/components/chat-message';
import { ChatMessageActions } from '@/components/chat-message-actions';

export interface ChatListProps extends React.ComponentProps<'div'> {
  id: string;
  reload?: () => void;
  messages: Message[];
  isLoading?: boolean;
  provider?: Provider;
  readonly?: boolean;
}

export function ChatList({
  id,
  reload,
  messages,
  isLoading,
  provider,
  className,
  readonly
}: ChatListProps) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className={cn('mx-auto w-full max-w-4xl flex-1 p-4', className)}>
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        return (
          <ChatMessage key={message.id} message={message} provider={provider}>
            {(!isLoading || !isLastMessage) && (
              <ChatMessageActions
                chatId={id}
                reload={reload}
                message={message}
                isLoading={isLoading}
                isLastMessage={isLastMessage}
                readonly={readonly}
              />
            )}
          </ChatMessage>
        );
      })}
      {isLoading && (
        <Badge variant="secondary" className="ml-11 rounded-full">
          <IconTyping className="stroke-muted-foreground text-muted-foreground" />
        </Badge>
      )}
      <ButtonScrollToBottom />
    </div>
  );
}
