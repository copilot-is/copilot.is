'use client'

import { useChat, type Message } from 'ai/react'
import { toast } from 'react-hot-toast'
import { usePathname, useRouter } from 'next/navigation'

import { type Chat } from '@/lib/types'
import {
  fetcher,
  messageId,
  providerFromModel,
  buildChatUsage
} from '@/lib/utils'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { ChatHeader } from '@/components/chat-header'
import { useSettings } from '@/lib/hooks/use-settings'
import { updateChat } from '@/app/actions'
import { GenerateTitlePrompt } from '@/lib/constant'

interface ChatProps {
  id: string
  chat?: Chat
}

export function Chat({ id, chat }: ChatProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { title, usage, messages: initialMessages } = chat ?? {}

  const [_, setNewChatId] = useLocalStorage<string>('new-chat-id')
  const { allowCustomAPIKey, model, token, modelSettings } = useSettings()

  const generateId = messageId()
  const currentUsage = usage
    ? { ...usage, prompt: modelSettings.prompt }
    : { ...modelSettings, model }
  const chatUsage = buildChatUsage(currentUsage)
  const provider = providerFromModel(currentUsage.model)
  const previewToken = allowCustomAPIKey
    ? token?.[provider] || undefined
    : undefined
  const api = '/api/chat/' + provider
  const {
    isLoading,
    append,
    reload,
    stop,
    messages,
    setMessages,
    input,
    setInput
  } = useChat({
    id,
    api,
    initialMessages,
    sendExtraMessageFields: true,
    generateId: () => generateId,
    body: {
      id,
      title,
      generateId,
      usage: {
        ...chatUsage,
        stream: true,
        previewToken
      }
    },
    async onResponse(response) {
      if (response.status !== 200) {
        setInput(input)
        const json = await response.json()
        toast.error(json.message)
      }
    },
    async onFinish(message) {
      if (!pathname.includes('chat')) {
        window.history.pushState({}, '', `/chat/${id}`)
        await generateTitle(id, input, message)
        setNewChatId(id)
        router.refresh()
      }
    }
  })

  const generateTitle = async (id: string, input: string, message: Message) => {
    try {
      const genModel = {
        openai: 'gpt-3.5-turbo',
        google: 'gemini-pro',
        anthropic: 'claude-3-haiku-20240307'
      }
      const genUsage = buildChatUsage({
        ...chatUsage,
        model: genModel[provider]
      })
      if (input && message && message.content) {
        const data = await fetcher(`/api/chat/${provider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: input },
              { role: message.role, content: message.content },
              {
                role: 'user',
                content: GenerateTitlePrompt
              }
            ],
            usage: {
              ...genUsage,
              previewToken
            }
          })
        })

        if (data.length && data[0]?.content) {
          await updateChat(id, { title: data[0]?.content })
        }
      }
    } catch (err) {
      toast.error('Generate title failed')
    }
  }

  return (
    <>
      <ChatHeader chat={chat} />
      <div className="flex-1 py-4 md:pt-10">
        {messages.length ? (
          <>
            <ChatList
              id={id}
              provider={provider}
              messages={messages}
              setMessages={setMessages}
            />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>
      <ChatPanel
        chat={chat}
        messages={messages}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        input={input}
        setInput={setInput}
      />
    </>
  )
}
