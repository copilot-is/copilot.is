import * as React from 'react';

import { Message, ModelProvider } from '@/lib/types';
import { cn } from '@/lib/utils';
import { IconTyping } from '@/components/ui/icons';
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom';
import { ChatMessage } from '@/components/chat-message';
import { ChatMessageActions } from '@/components/chat-message-actions';

export interface ChatListProps extends React.ComponentProps<'div'> {
  id: string;
  reload?: () => void;
  messages: Message[];
  isLoading?: boolean;
  provider: ModelProvider;
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
    <div className={cn('mx-auto w-full max-w-4xl flex-1 p-4 pb-6', className)}>
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
        <div className="-mt-3 pl-12">
          <IconTyping className="stroke-muted-foreground text-muted-foreground" />
        </div>
      )}
      <ButtonScrollToBottom />
    </div>
  );
}
