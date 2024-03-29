import Anthropic from '@anthropic-ai/sdk'
import { Stream } from '@anthropic-ai/sdk/streaming'
import { MessageParam, MessageStreamEvent } from '@anthropic-ai/sdk/resources'
import { AnthropicStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server'

import { auth } from '@/server/auth'
import {
  getBase64FromDataURL,
  getMediaTypeFromDataURL,
  messageId,
  nanoid
} from '@/lib/utils'
import { Message, MessageContent, type Usage } from '@/lib/types'
import { appConfig } from '@/lib/appconfig'
import { api } from '@/trpc/server'

export const runtime = 'edge'

const extractContent = (content: MessageContent) => {
  if (Array.isArray(content)) {
    return content
      .map(c => {
        if (c.type === 'text') {
          return c
        } else {
          return (
            c.type === 'image' &&
            c.data && {
              type: 'image',
              source: {
                type: 'base64',
                media_type: getMediaTypeFromDataURL(c.data),
                data: getBase64FromDataURL(c.data)
              }
            }
          )
        }
      })
      .filter(Boolean)
  }
  return content
}

const buildAnthropicPrompt = (messages: Message[]) => {
  return messages.map(message => ({
    role: message.role,
    content: extractContent(message.content)
  })) as MessageParam[]
}

const buildAnthropicMessages = (result: Anthropic.Message) => {
  return result.content.map(message => {
    return {
      id: messageId(),
      role: result.role,
      content: message.text
    }
  })
}

const anthropic = new Anthropic({
  apiKey: appConfig.anthropic.apiKey,
  baseURL: appConfig.anthropic.baseURL
})

type PostData = {
  id?: string
  title?: string
  generateId: string
  messages: Message[]
  usage: Usage
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const json = await req.json()
  const { title = 'Untitled', messages, generateId, usage } = json as PostData
  const {
    model,
    stream,
    prompt,
    previewToken,
    temperature = 1,
    topP = 1,
    topK = 1,
    maxTokens = 4096
  } = usage

  if (!anthropic.apiKey && previewToken) {
    anthropic.apiKey = previewToken
  }

  try {
    const res = await anthropic.messages.create({
      model,
      messages: buildAnthropicPrompt(messages),
      stream,
      temperature,
      system: prompt,
      top_k: topK,
      top_p: topP,
      max_tokens: maxTokens
    })

    if (!stream) {
      const response = res as Anthropic.Message
      return NextResponse.json(buildAnthropicMessages(response))
    }

    const resStream = res as Stream<MessageStreamEvent>
    const aiStream = AnthropicStream(resStream, {
      async onCompletion(completion) {
        const id = json.id ?? nanoid()
        const payload = {
          id,
          title,
          messages: [
            ...messages,
            {
              id: generateId,
              content: completion,
              role: 'assistant'
            }
          ] as [Message],
          usage: {
            model,
            temperature,
            topP,
            topK,
            maxTokens
          }
        }
        await api.chat.create.mutate(payload)
      }
    })

    return new StreamingTextResponse(aiStream)
  } catch (err: any) {
    if (err instanceof Anthropic.APIError) {
      const status = err.status
      const error = err.error as Record<string, any>
      return NextResponse.json({ message: error.error.message }, { status })
    } else {
      return NextResponse.json({ message: err.message }, { status: 500 })
    }
  }
}
