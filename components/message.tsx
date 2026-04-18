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
  hasVisibleArtifacts?: boolean;
  hideMessageBody?: boolean;
  children: React.ReactNode;
}

export function Message({
  status,
  message,
  image,
  isLastMessage,
  supportsReasoning,
  hasVisibleArtifacts = false,
  hideMessageBody = false,
  children
}: MessageProps) {
  const hasVisibleTextContent = message.parts.some(
    part =>
      part.type === 'text' &&
      (part.text.trim().length > 0 || part.state === 'streaming')
  );
  const reasoningParts = message.parts.filter(
    part => part.type === 'reasoning'
  );
  const hasReasoningPart = reasoningParts.length > 0;
  const hasFilePart = message.parts.some(part => part.type === 'file');
  const firstReasoningIndex = message.parts.findIndex(
    part => part.type === 'reasoning'
  );
  const lastReasoningIndex = (() => {
    for (let index = message.parts.length - 1; index >= 0; index -= 1) {
      if (message.parts[index]?.type === 'reasoning') {
        return index;
      }
    }

    return -1;
  })();
  const mergedReasoningText = reasoningParts
    .map(part => part.text || (part as any).reasoning || '')
    .join('\n')
    .trim();
  const mergedReasoningPart = hasReasoningPart
    ? ({
        ...reasoningParts[0],
        text: mergedReasoningText,
        state: reasoningParts.some(part => part.state === 'streaming')
          ? 'streaming'
          : 'done'
      } as any)
    : null;
  const showReasoningLoading =
    isLastMessage === true &&
    lastReasoningIndex === message.parts.length - 1 &&
    !hasVisibleArtifacts;
  const hasVisibleReasoningDisplay =
    hasReasoningPart &&
    (mergedReasoningText.length > 0 || showReasoningLoading);
  const showSubmittedAssistantLoading =
    message.role === 'assistant' &&
    status === 'submitted' &&
    isLastMessage === true &&
    !hasVisibleArtifacts &&
    !hasVisibleReasoningDisplay &&
    !hasVisibleTextContent &&
    !hasFilePart;
  const showEmptyAssistantLoading =
    hideMessageBody &&
    message.role === 'assistant' &&
    status === 'streaming' &&
    isLastMessage === true;

  return (
    <div
      tabIndex={0}
      className="group mb-1 rounded-md last:mb-0 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden"
    >
      <div
        className={cn('flex items-start', {
          'flex-row-reverse': message.role === 'user'
        })}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted select-none">
          {message.role === 'user' && <User className="size-5" />}
          {message.role === 'assistant' && <ModelIcon image={image} />}
        </div>
        {showEmptyAssistantLoading && (
          <div className="ml-3 flex min-h-9 flex-1 flex-col justify-center overflow-hidden px-1">
            <div className="my-1 mr-12">
              <IconLoading className="text-muted-foreground" />
            </div>
          </div>
        )}
        {!hideMessageBody && (
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
                  if (index !== firstReasoningIndex || !mergedReasoningPart) {
                    return null;
                  }

                  return (
                    <MessageReasoning
                      key={index}
                      part={mergedReasoningPart}
                      reasonDuration={message.metadata?.reasonDuration}
                      isLoading={showReasoningLoading}
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
                !hasVisibleArtifacts &&
                !hasReasoningPart &&
                !hasVisibleTextContent &&
                !hasFilePart &&
                (supportsReasoning ? (
                  <MessageReasoning
                    isLoading={false}
                    isWaiting={true}
                    part={{ type: 'reasoning', text: '' } as any}
                    reasonDuration={message.metadata?.reasonDuration}
                  />
                ) : (
                  <div className="my-1">
                    <IconLoading className="text-muted-foreground" />
                  </div>
                ))}
              {showSubmittedAssistantLoading && (
                <div className="my-1">
                  <IconLoading className="text-muted-foreground" />
                </div>
              )}
              {status === 'streaming' &&
                isLastMessage &&
                !hasVisibleArtifacts &&
                !hasVisibleReasoningDisplay &&
                !hasVisibleTextContent &&
                !hasFilePart &&
                hasReasoningPart && (
                  <div className="my-1">
                    <IconLoading className="text-muted-foreground" />
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
