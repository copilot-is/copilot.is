import * as React from 'react'

import { cn } from '@/lib/utils'
import { Message, ModelProvider } from '@/lib/types'
import { Separator } from '@/components/ui/separator'
import { ChatMessage } from '@/components/chat-message'

export interface ChatListProps extends React.ComponentProps<'div'> {
  id: string
  messages: Message[]
  provider: ModelProvider
  setMessages?: (messages: Message[]) => void
}

export function ChatList({
  id,
  messages,
  provider,
  className,
  setMessages
}: ChatListProps) {
  if (!messages.length) {
    return null
  }

  return (
    <div className={cn('mx-auto max-w-4xl px-4', className)}>
      {messages.map((message, index) => (
        <React.Fragment key={index}>
          <ChatMessage
            chat={{ id, messages }}
            message={message}
            provider={provider}
            setMessages={setMessages}
          />
          {index < messages.length - 1 && (
            <Separator className="my-4 md:my-8" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
