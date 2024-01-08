'use client'

import { useChat, type Message } from 'ai/react'
import { toast } from 'react-hot-toast'
import { usePathname, useRouter } from 'next/navigation'

import { ServerActionResult, type Chat } from '@/lib/types'
import { buildChatUsage, fetcher, formatString, messageId } from '@/lib/utils'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { ChatHeader } from '@/components/chat-header'
import { useSettings } from '@/lib/hooks/use-settings'
import { KnowledgeCutOffDate, SupportedModels } from '@/lib/constant'

interface ChatProps {
  id: string
  chat?: Chat
  updateChat: (
    id: string,
    data: { [key: keyof Chat]: Chat[keyof Chat] }
  ) => ServerActionResult<Chat>
}

export function Chat({ id, chat, updateChat }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const { title, usage, messages: initialMessages } = chat ?? {}

  const [_, setNewChatId] = useLocalStorage<string>('new-chat-id')
  const { allowCustomAPIKey, model, token, modelSettings } = useSettings()

  const generateId = messageId()
  const currentTime = new Date().toLocaleString()
  const currentUsage = usage ?? { ...modelSettings, model }
  const currentModel = currentUsage.model
  const cutoff =
    KnowledgeCutOffDate[currentModel] ?? KnowledgeCutOffDate.default
  const provider = SupportedModels.find(m => m.value === currentModel)?.provider
  const prompt = modelSettings.prompt
    ? formatString(modelSettings.prompt, {
        cutoff,
        model: currentModel,
        time: currentTime
      })
    : undefined
  const previewToken =
    allowCustomAPIKey && provider ? token?.[provider] : undefined
  const chatUsage = buildChatUsage(currentUsage, provider, prompt)
  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      id,
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
        if (!path.includes('chat')) {
          window.history.pushState({}, '', `/chat/${id}`)
          await generateTitle(id, input, message)
          setNewChatId(id)
          router.refresh()
        }
      }
    })

  const generateTitle = async (id: string, input: string, message: Message) => {
    try {
      const genUsage = buildChatUsage(currentUsage, provider)
      if (input && message && message.content) {
        const data = await fetcher('/api/chat', {
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
                content:
                  'Please generate a four to five word title summarizing our conversation without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks.'
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
      // XXX
    }
  }

  return (
    <>
      <ChatHeader chat={chat} updateChat={updateChat} />
      <div className="flex-1 py-4 md:pt-10">
        {messages.length && provider ? (
          <>
            <ChatList messages={messages} provider={provider} />
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
