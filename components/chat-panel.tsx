import { type UseChatHelpers } from 'ai/react'

import { shareChat } from '@/app/actions'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { ChatRegenerate } from '@/components/chat-regenerate'
import { ChatShare } from '@/components/chat-share'
import { messageId, nanoid } from '@/lib/utils'

export interface ChatPanelProps
  extends Pick<
    UseChatHelpers,
    | 'append'
    | 'isLoading'
    | 'reload'
    | 'messages'
    | 'stop'
    | 'input'
    | 'setInput'
  > {
  id?: string
  title?: string
}

export function ChatPanel({
  id,
  title,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  messages
}: ChatPanelProps) {
  return (
    <div className="sticky inset-x-0 bottom-0 w-full animate-in duration-300 ease-in-out">
      <ButtonScrollToBottom />
      <div className="mx-auto max-w-4xl md:px-4">
        <div className="flex py-3 items-center justify-center">
          <div className="flex space-x-2">
            <ChatRegenerate
              isLoading={isLoading}
              hasMessages={!!messages?.length}
              stop={stop}
              reload={reload}
            />
            {id && title ? (
              <ChatShare
                chat={{
                  id,
                  title,
                  messages
                }}
                shareChat={shareChat}
              />
            ) : null}
          </div>
        </div>
        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            onSubmit={async value => {
              await append({
                id: messageId(),
                content: value,
                role: 'user'
              })
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
