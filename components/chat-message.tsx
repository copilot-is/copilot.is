'use client'

import React from 'react'
import Image from 'next/image'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { Message, ModelProvider, type Chat } from '@/lib/types'
import { CodeBlock } from '@/components/ui/codeblock'
import {
  IconClaudeAI,
  IconGoogleAI,
  IconOpenAI,
  IconUser
} from '@/components/ui/icons'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { ChatMessageActions } from '@/components/chat-message-actions'

export interface ChatMessageProps {
  chat: Pick<Chat, 'id' | 'messages'>
  message: Message
  provider: ModelProvider
  setMessages?: (messages: Message[]) => void
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
      <div className="flex-1 ml-4 mt-1 overflow-hidden">
        {Array.isArray(message.content) && message.content.length > 0 && (
          <div className="flex space-x-2 mb-2">
            {message.content.map((c, i) => {
              if (c.type !== 'text') {
                return (
                  c.data && (
                    <div key={i}>
                      <Image
                        alt=""
                        width={0}
                        height={0}
                        loading="lazy"
                        className="max-w-xs w-full h-auto mt-0 mb-3"
                        src={c.data}
                      />
                    </div>
                  )
                )
              }
            })}
          </div>
        )}

        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            img({ node, ...props }) {
              return <img alt="" className="max-w-[70%] mt-0 mb-3" {...props} />
            },
            code({ node, className, children, ...props }) {
              const childArray = React.Children.toArray(children)
              const firstChild = childArray[0] as React.ReactElement
              const firstChildAsString = React.isValidElement(firstChild)
                ? (firstChild as React.ReactElement).props.children
                : firstChild

              if (firstChildAsString === '▍') {
                return (
                  <span className="mt-1 animate-pulse cursor-default">▍</span>
                )
              }

              if (typeof firstChildAsString === 'string') {
                childArray[0] = firstChildAsString.replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (
                typeof firstChildAsString === 'string' &&
                !firstChildAsString.includes('\n')
              ) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {Array.isArray(message.content)
            ? message.content
                .map(c => {
                  if (c.type === 'text') {
                    return c.text
                  }
                })
                .join('\n\n')
            : message.content}
        </MemoizedReactMarkdown>
        <ChatMessageActions
          chat={chat}
          message={message}
          setMessages={setMessages}
        />
      </div>
    </div>
  )
}
