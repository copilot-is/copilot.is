import * as React from 'react'

import { cn } from '@/lib/utils'
import {
  ServerActionResult,
  Message,
  ModelProvider,
  type Chat
} from '@/lib/types'
import { Separator } from '@/components/ui/separator'
import { ChatMessage } from '@/components/chat-message'

export interface ChatListProps extends React.ComponentProps<'div'> {
  id: string
  messages: Message[]
  provider: ModelProvider
  setMessages?: (messages: Message[]) => void
  updateChat?: (
    id: string,
    data: { [key: keyof Chat]: Chat[keyof Chat] }
  ) => ServerActionResult<Chat>
}

export function ChatList({
  id,
  messages,
  provider,
  className,
  setMessages,
  updateChat
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
            updateChat={updateChat}
          />
          {index < messages.length - 1 && (
            <Separator className="my-4 md:my-8" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
