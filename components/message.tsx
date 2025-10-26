import React from 'react';
import { UseChatHelpers } from '@ai-sdk/react';
import { CircleNotch, User } from '@phosphor-icons/react';

import { ChatMessage, Provider } from '@/types';
import { cn } from '@/lib/utils';
import { IconTyping } from '@/components/ui/icons';
import { MessageMarkdown } from '@/components/message-markdown';
import { MessageReasoning } from '@/components/message-reasoning';
import { ProviderIcon } from '@/components/provider-icon';

export interface MessageProps
  extends Partial<Pick<UseChatHelpers<ChatMessage>, 'status'>> {
  message: ChatMessage;
  provider?: Provider;
  isLastMessage?: boolean;
  isReasoning?: boolean;
  children: React.ReactNode;
}

export function Message({
  status,
  message,
  provider,
  isLastMessage,
  isReasoning,
  children
}: MessageProps) {
  return (
    <div
      tabIndex={0}
      className="group mb-1 rounded-md pb-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div
        className={cn('flex items-start', {
          'flex-row-reverse': message.role === 'user'
        })}
      >
        <div className="flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-muted">
          {message.role === 'user' && <User />}
          {message.role === 'assistant' && <ProviderIcon provider={provider} />}
        </div>
        <div
          className={cn(
            'flex min-h-9 flex-1 flex-col justify-center overflow-hidden px-1',
            message.role === 'user' ? 'mr-3 items-end' : 'ml-3 items-start'
          )}
        >
          <div
            className={cn(
              message.role === 'user'
                ? 'ml-12 rounded-2xl bg-muted px-3 py-1.5'
                : 'mr-12'
            )}
          >
            {message.parts.map((part, index) => {
              if (part.type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={index}
                    part={part}
                    isLoading={
                      isLastMessage === true &&
                      isReasoning === true &&
                      status === 'streaming' &&
                      index === message.parts.length - 1
                    }
                  />
                );
              }

              if (part.type === 'text') {
                return message.role === 'user' ? (
                  <p key={index} className="whitespace-pre-wrap">
                    {part.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <br />}
                        {line}
                      </React.Fragment>
                    ))}
                  </p>
                ) : (
                  <MessageMarkdown key={index} content={part.text} />
                );
              }

              if (part.type === 'file' && part.mediaType.startsWith('image/')) {
                return (
                  <img
                    className="m-0 h-auto max-w-10 rounded-md sm:max-w-32"
                    key={index}
                    src={part.url}
                    alt={part.filename}
                  />
                );
              }
            })}

            {status === 'streaming' &&
              isLastMessage &&
              isReasoning &&
              !message.parts.find(p => p.type === 'reasoning')?.text && (
                <div className="-ml-1 flex h-8 items-center gap-1 text-sm font-normal text-muted-foreground">
                  <CircleNotch className="size-4 animate-spin" />
                  <span>Thinking</span>
                </div>
              )}
            {status === 'streaming' &&
              isLastMessage &&
              !isReasoning &&
              !message.parts.find(p => p.type === 'reasoning')?.text && (
                <IconTyping className="text-muted-foreground" />
              )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
