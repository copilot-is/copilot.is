'use client'

import { useChat, type Message } from 'ai/react'
import { toast } from 'react-hot-toast'
import { usePathname, useRouter } from 'next/navigation'

import { type Chat } from '@/lib/types'
import {
  messageId,
  isVisionModel,
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
import { api } from '@/lib/api'

interface ChatProps {
  id: string
  chat?: Chat
}

export function Chat({ id, chat }: ChatProps) {
  const router = useRouter()
  const pathname = usePathname()
  const generateId = messageId()
  const [_, setNewChatId] = useLocalStorage<string>('new-chat-id')
  const { allowCustomAPIKey, model, token, modelSettings } = useSettings()

  const { title, usage, messages: initialMessages } = chat ?? {}
  const currentUsage = usage
    ? { ...usage, prompt: modelSettings.prompt }
    : { ...modelSettings, model }
  const currentModel = currentUsage.model
  const vision = isVisionModel(currentModel)
  const provider = providerFromModel(currentModel)
  const previewToken = allowCustomAPIKey
    ? token?.[provider] || undefined
    : undefined
  const chatUsage = buildChatUsage({
    ...currentUsage,
    stream: true,
    previewToken
  })
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
    api: '/api/chat/' + provider,
    initialMessages,
    sendExtraMessageFields: true,
    generateId: () => generateId,
    body: {
      id,
      title,
      generateId,
      usage: chatUsage
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
    const genModel = {
      openai: 'gpt-3.5-turbo',
      google: 'gemini-pro',
      anthropic: 'claude-3-haiku-20240307'
    }
    const genMessages = [
      { role: 'user', content: input },
      { role: message.role, content: message.content },
      {
        role: 'user',
        content: GenerateTitlePrompt
      }
    ] as Message[]
    const genUsage = buildChatUsage({
      ...currentUsage,
      model: genModel[provider],
      prompt: undefined,
      previewToken
    })

    const data = await api.createChat(provider, {
      messages: genMessages,
      usage: genUsage
    })

    if (data.length && data[0]?.content) {
      await updateChat(id, { title: data[0]?.content })
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
          <EmptyScreen provider={provider} setInput={setInput} />
        )}
      </div>
      <ChatPanel
        chat={chat}
        vision={vision}
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
