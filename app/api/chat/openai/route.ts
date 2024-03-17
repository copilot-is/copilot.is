import OpenAI from 'openai'
import {
  type ChatCompletion,
  type ChatCompletionMessageParam
} from 'openai/resources'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server'

import { auth } from '@/server/auth'
import { nanoid, messageId } from '@/lib/utils'
import { Message, type Usage } from '@/lib/types'
import { appConfig } from '@/lib/appconfig'
import { api } from '@/trpc/server'

export const runtime = 'edge'

const buildOpenAIPrompt = (messages: Message[], prompt?: string) => {
  const systemMessage = { role: 'system', content: prompt } as Message
  const mergedMessages = prompt ? [systemMessage, ...messages] : messages

  return mergedMessages.map(
    ({ role, content, name, function_call }) =>
      ({
        role,
        content,
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
    frequencyPenalty = 0,
    presencePenalty = 0,
    temperature = 0.5,
    topP = 1,
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
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      top_p: topP,
      max_tokens: maxTokens
    })

    if (!stream) {
      const response = await res.asResponse()
      const data = await response.json()
      return NextResponse.json(buildOpenAIMessages(data))
    }

    const resStream = await res.asResponse()
    const aiStream = OpenAIStream(resStream, {
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
            frequencyPenalty,
            presencePenalty,
            topP,
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
