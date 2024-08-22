'use client';

import { type UseChatHelpers } from 'ai/react';

import { UserContent, type Chat } from '@/lib/types';
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom';
import { ChatRegenerate } from '@/components/chat-regenerate';
import { ChatShare } from '@/components/chat-share';
import { PromptForm } from '@/components/prompt-form';

export interface ChatPanelProps
  extends Pick<UseChatHelpers, 'stop' | 'input' | 'setInput'> {
  chat?: Chat;
  isVision: boolean;
  isLoading: boolean;
  hasMessages: boolean;
  isAtBottom: boolean;
  scrollToBottom: () => void;
  append: (role: string, content: UserContent) => void;
  reload: () => void;
}

export function ChatPanel({
  chat,
  stop,
  append,
  reload,
  input,
  setInput,
  isLoading,
  isVision,
  isAtBottom,
  hasMessages,
  scrollToBottom
}: ChatPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 duration-300 ease-in-out animate-in peer-[[data-state=open]]:group-[]:lg:pl-[250px] xl:right-[6px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto max-w-4xl md:px-3">
        <div className="flex items-center justify-center space-x-3 py-3">
          <ChatRegenerate
            isLoading={isLoading}
            hasMessages={hasMessages}
            stop={stop}
            reload={reload}
          />
          <ChatShare chat={chat} />
        </div>
        <div className="space-y-4 border-t bg-background p-4 shadow-lg sm:rounded-t-xl sm:border sm:border-b-0">
          <PromptForm
            isVision={isVision}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSubmit={async value => {
              if (!isAtBottom) {
                setTimeout(() => {
                  scrollToBottom();
                }, 100);
              }
              await append('user', value);
            }}
          />
        </div>
      </div>
    </div>
  );
}
