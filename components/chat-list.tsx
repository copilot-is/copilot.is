import { Fragment } from 'react'
import { type Message } from 'ai'

import { Separator } from '@/components/ui/separator'
import { ChatMessage } from '@/components/chat-message'
import { cn } from '@/lib/utils'

export interface ChatListProps extends React.ComponentProps<'div'> {
  messages: Message[]
  provider: string
}

export function ChatList({ messages, provider, className }: ChatListProps) {
  if (!messages.length) {
    return null
  }

  return (
    <div className={cn('mx-auto max-w-4xl px-4', className)}>
      {messages.map((message, index) => (
        <Fragment key={index}>
          <ChatMessage message={message} provider={provider} />
          {index < messages.length - 1 && (
            <Separator className="my-4 md:my-8" />
          )}
        </Fragment>
      ))}
    </div>
  )
}
