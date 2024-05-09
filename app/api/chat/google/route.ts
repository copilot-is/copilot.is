import {
  Part,
  GoogleGenerativeAI,
  type GenerateContentResult,
  type GenerateContentRequest
} from '@google/generative-ai'
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server'

import { auth } from '@/server/auth'
import {
  nanoid,
  messageId,
  getBase64FromDataURL,
  getMediaTypeFromDataURL
} from '@/lib/utils'
import { Message, MessageContent, Model, type Usage } from '@/lib/types'
import { appConfig } from '@/lib/appconfig'
import { api } from '@/trpc/server'

export const runtime = 'edge'

const extractContent = (content: MessageContent): Part[] => {
  if (Array.isArray(content)) {
    const parts = content
      .map(c => {
        if (c.type === 'text') {
          return { text: c.text }
        } else {
          return (
            c.type === 'image' &&
            c.data && {
              inlineData: {
                mimeType: getMediaTypeFromDataURL(c.data),
                data: getBase64FromDataURL(c.data)
              }
            }
          )
        }
      })
      .filter(Boolean)
    return parts as Part[]
  }
  return [{ text: content }]
}

const buildGoogleGenAIPrompt = (
  messages: Message[],
  model: Model
): GenerateContentRequest => ({
  contents: (model === 'gemini-pro-vision'
    ? [messages[messages.length - 1]]
    : messages
  )
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: extractContent(message.content)
    }))
})

const buildGoogleGenAIMessages = (result: GenerateContentResult) => {
  return result.response.candidates?.map(candidates => {
    const message = candidates.content
    const content = message.parts[0].text
    const role = message.role === 'user' ? 'user' : 'assistant'
    return {
      id: messageId(),
      role,
      content
    }
  })
}

const googleai = new GoogleGenerativeAI(appConfig.google.apiKey)

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
    previewToken,
    temperature = 0.5,
    maxTokens
  } = usage

  if (!googleai.apiKey && previewToken) {
    googleai.apiKey = previewToken
  }

  try {
    const res = googleai.getGenerativeModel(
      {
        model,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      },
      {
        baseUrl: appConfig.google.baseURL
      }
    )

    if (!stream) {
      const genContent = await res.generateContent(
        buildGoogleGenAIPrompt(messages, model)
      )
      return NextResponse.json(buildGoogleGenAIMessages(genContent))
    }

    const resStream = await res.generateContentStream(
      buildGoogleGenAIPrompt(messages, model)
    )
    const aiStream = GoogleGenerativeAIStream(resStream, {
      onCompletion: async (completion: string) => {
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
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
