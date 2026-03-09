import React from 'react';
import { UseChatHelpers } from '@ai-sdk/react';
import { User } from 'lucide-react';

import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { IconLoading } from '@/components/ui/icons';
import { AudioPlayer } from '@/components/audio-player';
import { MessageMarkdown } from '@/components/message-markdown';
import { MessageReasoning } from '@/components/message-reasoning';
import { ModelIcon } from '@/components/model-icon';
import { VideoPlayer } from '@/components/video-player';

export interface MessageProps extends Partial<
  Pick<UseChatHelpers<ChatMessage>, 'status'>
> {
  message: ChatMessage;
  image?: string | null;
  isLastMessage?: boolean;
  supportsReasoning?: boolean | null;
  children: React.ReactNode;
}

export function Message({
  status,
  message,
  image,
  isLastMessage,
  supportsReasoning,
  children
}: MessageProps) {
  return (
    <div
      tabIndex={0}
      className="group mb-1 rounded-md last:mb-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div
        className={cn('flex items-start', {
          'flex-row-reverse': message.role === 'user'
        })}
      >
        <div className="flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-muted">
          {message.role === 'user' && <User className="size-5" />}
          {message.role === 'assistant' && <ModelIcon image={image} />}
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
                    isWaiting={
                      status === 'streaming' &&
                      isLastMessage === true &&
                      !message.parts.some(
                        p => p.type === 'text' && p.text.length > 0
                      )
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
                    <div key={index} className="my-2 max-w-80">
                      <img
                        className="max-h-96 rounded-lg"
                        src={part.url}
                        alt={part.filename || 'Generated image'}
                      />
                    </div>
                  );
                }

                // Render audio
                if (part.mediaType.startsWith('audio/')) {
                  return (
                    <div key={index} className="my-2 min-w-80">
                      <AudioPlayer src={part.url} />
                    </div>
                  );
                }

                // Render video
                if (part.mediaType.startsWith('video/')) {
                  return (
                    <div key={index} className="my-2 max-w-80">
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
              !message.parts.some(part => part.type === 'reasoning') &&
              (message.parts.length <= 1 ||
                message.parts.some(
                  part =>
                    part.type === 'text' &&
                    part.state === 'streaming' &&
                    part.text.length === 0
                )) &&
              (supportsReasoning ? (
                <MessageReasoning
                  isLoading={true}
                  part={{ type: 'reasoning', text: '' } as any}
                />
              ) : (
                <div className="my-1">
                  <IconLoading className="text-muted-foreground" />
                </div>
              ))}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
