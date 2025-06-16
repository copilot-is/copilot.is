import React from 'react';
import { UseChatHelpers } from '@ai-sdk/react';
import { UIMessage } from '@ai-sdk/ui-utils';
import { CircleNotch, User } from '@phosphor-icons/react';

import { Provider } from '@/types';
import { cn } from '@/lib/utils';
import { IconTyping } from '@/components/ui/icons';
import { ChatMessageMarkdown } from '@/components/chat-message-markdown';
import { ChatMessageReasoning } from '@/components/chat-message-reasoning';
import { ProviderIcon } from '@/components/provider-icon';

export interface ChatMessageProps
  extends Partial<Pick<UseChatHelpers, 'status'>> {
  message: UIMessage;
  provider?: Provider;
  isReasoning?: boolean;
  children: React.ReactNode;
}

export function ChatMessage({
  status,
  message,
  provider,
  isReasoning,
  children
}: ChatMessageProps) {
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
                  <ChatMessageReasoning
                    key={index}
                    part={part}
                    isLoading={
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
                  <ChatMessageMarkdown key={index} content={part.text} />
                );
              }

              if (part.type === 'file' && part.mimeType.startsWith('image/')) {
                return (
                  <img
                    className="m-0 h-auto max-w-10 rounded-md sm:max-w-32"
                    key={index}
                    src={`data:${part.mimeType};base64,${part.data}`}
                    alt="Generated image"
                  />
                );
              }
            })}

            {status === 'streaming' &&
              isReasoning === true &&
              !message.content &&
              !message.parts.find(p => p.type === 'reasoning')?.reasoning && (
                <div className="-ml-1 flex h-8 items-center gap-1 text-sm font-normal text-muted-foreground">
                  <CircleNotch className="size-4 animate-spin" />
                  <span>Thinking</span>
                </div>
              )}
            {status === 'streaming' &&
              !isReasoning &&
              !message.content &&
              !message.parts.find(p => p.type === 'reasoning')?.reasoning && (
                <IconTyping className="text-muted-foreground" />
              )}
          </div>
          {message.experimental_attachments &&
            message.experimental_attachments.length > 0 && (
              <div className="mt-2 flex flex-row flex-wrap gap-2">
                {message.experimental_attachments
                  .filter(attachment =>
                    attachment.contentType?.startsWith('image/')
                  )
                  .map((attachment, index) => (
                    <figure
                      key={`${message.id}-${index}`}
                      className="size-12 overflow-hidden rounded-lg"
                    >
                      <img
                        className="mx-auto size-full object-cover"
                        src={attachment.url}
                        alt={attachment.name}
                      />
                    </figure>
                  ))}
              </div>
            )}
        </div>
      </div>
      {children}
    </div>
  );
}
