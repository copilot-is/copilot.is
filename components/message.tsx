import React from 'react';
import { UseChatHelpers } from '@ai-sdk/react';
import { CircleNotch, User } from '@phosphor-icons/react';

import { ChatMessage, Provider } from '@/types';
import { cn } from '@/lib/utils';
import { IconTyping } from '@/components/ui/icons';
import { AudioPlayer } from '@/components/audio-player';
import { MessageMarkdown } from '@/components/message-markdown';
import { MessageReasoning } from '@/components/message-reasoning';
import { ProviderIcon } from '@/components/provider-icon';
import { VideoPlayer } from '@/components/video-player';

export interface MessageProps
  extends Partial<Pick<UseChatHelpers<ChatMessage>, 'status'>> {
  message: ChatMessage;
  provider?: Provider;
  isLastMessage?: boolean;
  children: React.ReactNode;
}

export function Message({
  status,
  message,
  provider,
  isLastMessage,
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

              if (part.type === 'file') {
                // Render image
                if (part.mediaType.startsWith('image/')) {
                  return (
                    <div key={index} className="my-2">
                      <img
                        className="h-auto max-w-full rounded-lg border"
                        src={part.url}
                        alt={part.filename || 'Generated image'}
                      />
                    </div>
                  );
                }

                // Render audio
                if (part.mediaType.startsWith('audio/')) {
                  return (
                    <div key={index} className="my-2">
                      <AudioPlayer src={part.url} />
                    </div>
                  );
                }

                // Render video
                if (part.mediaType.startsWith('video/')) {
                  return (
                    <div key={index} className="my-2">
                      <VideoPlayer src={part.url} />
                    </div>
                  );
                }

                // Display download link for other file types
                return (
                  <a
                    key={index}
                    href={part.url}
                    title={part.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline hover:no-underline"
                  >
                    Download file
                  </a>
                );
              }
            })}
            {status === 'streaming' &&
              isLastMessage &&
              (message.parts.length <= 1 ||
                message.parts.some(
                  part => part.type === 'text' && part.state === 'streaming'
                )) && <IconTyping className="my-1 text-muted-foreground" />}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
