'use client';

import React from 'react';
import { User } from '@phosphor-icons/react';

import { Message, ModelProvider } from '@/lib/types';
import { cn } from '@/lib/utils';
import { IconClaudeAI, IconGoogleAI, IconOpenAI } from '@/components/ui/icons';
import { ChatMessageMarkdown } from '@/components/chat-message-markdown';

export interface ChatMessageProps {
  message: Message;
  provider: ModelProvider;
  children: React.ReactNode;
}

export function ChatMessage({ message, provider, children }: ChatMessageProps) {
  return (
    <div className="group relative flex items-start pb-7">
      <div
        className={cn(
          'flex size-8 shrink-0 select-none items-center justify-center rounded-full border',
          message.role !== 'user' ? 'bg-muted' : ''
        )}
      >
        {message.role === 'user' ? <User /> : null}
        {message.role !== 'user' && (
          <>
            {provider === 'openai' && <IconOpenAI />}
            {provider === 'google' && <IconGoogleAI />}
            {provider === 'anthropic' && <IconClaudeAI />}
          </>
        )}
      </div>
      <div
        className={cn(
          'ml-3 flex min-h-8 flex-1 items-center overflow-hidden',
          message.role === 'assistant' ? 'rounded-lg bg-muted p-3' : ''
        )}
      >
        <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
          {message.role === 'user' && (
            <>
              {Array.isArray(message.content) && message.content.length > 0 && (
                <p className="mb-0 flex space-x-2">
                  {message.content.map((c, i) => {
                    if (c.type === 'image') {
                      return (
                        c.image && (
                          <img
                            alt=""
                            key={i}
                            loading="lazy"
                            className="m-0 h-auto max-w-10 rounded-md sm:max-w-32"
                            src={c.image.toString()}
                          />
                        )
                      );
                    }
                  })}
                </p>
              )}
              {Array.isArray(message.content) ? (
                message.content.map((c, i) => {
                  if (c.type === 'text') {
                    return (
                      <p key={i} className="mb-2 last:mb-0">
                        {c.text}
                      </p>
                    );
                  }
                })
              ) : (
                <p className="mb-2 last:mb-0">{message.content}</p>
              )}
            </>
          )}
          {message.role === 'assistant' &&
            typeof message.content === 'string' && (
              <ChatMessageMarkdown content={message.content} />
            )}
        </div>
        {children}
      </div>
    </div>
  );
}
