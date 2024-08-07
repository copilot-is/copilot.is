'use client';

import React from 'react';

import { Message, ModelProvider, type Chat } from '@/lib/types';
import {
  IconClaudeAI,
  IconGoogleAI,
  IconOpenAI,
  IconUser
} from '@/components/ui/icons';
import { ChatMessageActions } from '@/components/chat-message-actions';
import { ChatMessageMarkdown } from '@/components/chat-message-markdown';

export interface ChatMessageProps {
  chat: Pick<Chat, 'id' | 'messages'>;
  message: Message;
  provider: ModelProvider;
  setMessages?: (messages: Message[]) => void;
}

export function ChatMessage({
  chat,
  message,
  provider,
  setMessages
}: ChatMessageProps) {
  return (
    <div className="relative mb-4 flex items-start">
      <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-md border bg-background">
        {message.role === 'user' ? <IconUser /> : null}
        {message.role !== 'user' && (
          <>
            {provider === 'openai' && <IconOpenAI />}
            {provider === 'google' && <IconGoogleAI />}
            {provider === 'anthropic' && <IconClaudeAI />}
          </>
        )}
      </div>
      <div className="ml-4 mt-1 flex-1 overflow-hidden">
        <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
          {message.role === 'user' && (
            <>
              {Array.isArray(message.content) && message.content.length > 0 && (
                <p className="mb-2 flex space-x-2">
                  {message.content.map((c, i) => {
                    if (c.type === 'image') {
                      return (
                        c.image && (
                          <img
                            alt=""
                            key={i}
                            loading="lazy"
                            className="mb-3 mt-0 h-auto w-full max-w-xs"
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
        <ChatMessageActions
          chat={chat}
          message={message}
          setMessages={setMessages}
        />
      </div>
    </div>
  );
}
