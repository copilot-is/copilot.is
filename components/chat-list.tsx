import * as React from 'react';

import { Message, ModelProvider } from '@/lib/types';
import { cn } from '@/lib/utils';
import { IconTyping } from '@/components/ui/icons';
import { ChatMessage } from '@/components/chat-message';

export interface ChatListProps extends React.ComponentProps<'div'> {
  id: string;
  messages: Message[];
  isLoading?: boolean;
  provider: ModelProvider;
  setMessages?: (messages: Message[]) => void;
}

export function ChatList({
  id,
  messages,
  isLoading,
  provider,
  className,
  setMessages
}: ChatListProps) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className={cn('mx-auto max-w-4xl px-4', className)}>
      {messages.map(message => (
        <ChatMessage
          key={message.id}
          chat={{ id, messages }}
          message={message}
          provider={provider}
          setMessages={setMessages}
        />
      ))}
      {isLoading && (
        <div className="pl-14">
          <IconTyping className="ml-1 fill-zinc-400 stroke-zinc-400" />
        </div>
      )}
    </div>
  );
}
