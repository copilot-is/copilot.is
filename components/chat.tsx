'use client'

import { useChat, type Message } from 'ai/react'
import { toast } from 'react-hot-toast'
import { usePathname, useRouter } from 'next/navigation'

import { ServerActionResult, type Chat, Usage } from '@/lib/types'
import { cn, fetcher, formatString, messageId } from '@/lib/utils'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { ChatHeader } from '@/components/chat-header'
import { useSettings } from '@/lib/hooks/use-settings'
import { KnowledgeCutOffDate, SupportedModels } from '@/lib/constant'

interface ChatProps extends React.ComponentProps<'div'> {
  id?: string
  title?: string
  initialMessages?: Message[]
  usage?: Usage
  updateChat?: (
    id: string,
    data: { [key: keyof Chat]: Chat[keyof Chat] }
  ) => ServerActionResult<void>
}

export function Chat({
  id,
  title,
  usage,
  initialMessages,
  updateChat,
  className
}: ChatProps) {
  const router = useRouter()
  const path = usePathname()

  const [_, setNewChatId] = useLocalStorage<string>('new-chat-id')
  const { allowCustomAPIKey, model, token, modelSettings } = useSettings()
  const provider = SupportedModels.find(
    m => m.value === (usage?.model || model)
  )?.provider

  const generateId = messageId()
  const currentModel = usage?.model || model
  const cutoff =
    KnowledgeCutOffDate[currentModel] ?? KnowledgeCutOffDate.default
  const time = new Date().toLocaleString()
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
          ...(usage ?? modelSettings),
          stream: true,
          model: currentModel,
          prompt: modelSettings.prompt
            ? formatString(modelSettings.prompt, {
                cutoff,
                model: currentModel,
                time
              })
            : undefined,
          previewToken:
            allowCustomAPIKey && provider ? token?.[provider] : undefined
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
        if (!path.includes('chat') && id) {
          router.push(`/chat/${id}`, { scroll: false })
          await generateTitle(id, input, message)
          setNewChatId(id)
          router.refresh()
        }
      }
    })

  const generateTitle = async (id: string, input: string, message: Message) => {
    try {
      if (updateChat && input && message && message.content) {
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
              ...(usage ?? modelSettings),
              model: currentModel,
              prompt: undefined,
              previewToken:
                allowCustomAPIKey && provider ? token?.[provider] : undefined
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
      <ChatHeader id={id} usage={usage} />
      <div className={cn('flex-1 py-4 md:pt-10', className)}>
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
        id={id}
        title={title}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
      />
    </>
  )
}
