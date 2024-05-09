import OpenAI from 'openai'
import {
  type ChatCompletion,
  type ChatCompletionMessageParam
} from 'openai/resources'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server'

import { auth } from '@/server/auth'
import { nanoid, messageId } from '@/lib/utils'
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
              type: 'image_url',
              image_url: {
                url: c.data
              }
            }
          )
        }
      })
      .filter(Boolean)
  }
  return content
}

const buildOpenAIPrompt = (messages: Message[], prompt?: string) => {
  const systemMessage = { role: 'system', content: prompt } as Message
  const mergedMessages = prompt ? [systemMessage, ...messages] : messages

  return mergedMessages.map(
    ({ role, content, name, function_call }) =>
      ({
        role,
        content: extractContent(content),
        ...(name !== undefined && { name }),
        ...(function_call !== undefined && { function_call })
      }) as ChatCompletionMessageParam
  )
}

const buildOpenAIMessages = (result: ChatCompletion) => {
  const messages: Message[] = []

  result.choices.forEach(choice => {
    const { message } = choice

    const role = message.role
    const content = message.content || ''

    messages.push({ id: messageId(), role, content })
  })

  return messages
}

const openai = new OpenAI({
  apiKey: appConfig.openai.apiKey,
  baseURL: appConfig.openai.baseURL
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
    temperature = 0.5,
    maxTokens
  } = usage

  if (!openai.apiKey && previewToken) {
    openai.apiKey = previewToken
  }

  try {
    const res = openai.chat.completions.create({
      model,
      messages: buildOpenAIPrompt(messages, prompt),
      stream,
      temperature,
      max_tokens: maxTokens
    })

    const response = await res.asResponse()

    if (!stream) {
      const data = await response.json()
      return NextResponse.json(buildOpenAIMessages(data))
    }

    const aiStream = OpenAIStream(response, {
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
            maxTokens
          }
        }
        await api.chat.create.mutate(payload)
      }
    })

    return new StreamingTextResponse(aiStream)
  } catch (err: any) {
    if (err instanceof OpenAI.APIError) {
      const status = err.status
      const error = err.error as Record<string, any>
      return NextResponse.json({ message: error.message }, { status })
    } else {
      return NextResponse.json({ message: err.message }, { status: 500 })
    }
  }
}
