import { type UseChatHelpers } from 'ai/react'

import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { ChatRegenerate } from '@/components/chat-regenerate'
import { ChatShare } from '@/components/chat-share'
import { messageId } from '@/lib/utils'
import { type Chat } from '@/lib/types'

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
  chat?: Chat
}

export function ChatPanel({
  chat,
  messages,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput
}: ChatPanelProps) {
  return (
    <div className="sticky inset-x-0 bottom-0 w-full">
      <ButtonScrollToBottom />
      <div className="mx-auto max-w-4xl md:px-4">
        <div className="flex items-center justify-center py-3 space-x-3">
          <ChatRegenerate
            isLoading={isLoading}
            hasMessages={!!messages?.length}
            stop={stop}
            reload={reload}
          />
          <ChatShare chat={chat} messages={messages} />
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
