import {
  GoogleGenerativeAI,
  type GenerateContentResult
} from '@google/generative-ai'
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server'

import { auth } from '@/server/auth'
import { nanoid, messageId } from '@/lib/utils'
import { Message, type Usage } from '@/lib/types'
import { appConfig } from '@/lib/appconfig'
import { api } from '@/trpc/server'

export const runtime = 'edge'

const buildGoogleGenAIPrompt = (messages: Message[]) => ({
  contents: messages
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }]
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
    topP = 1,
    topK = 40,
    maxTokens
  } = usage

  if (!googleai.apiKey && previewToken) {
    googleai.apiKey = previewToken
  }

  try {
    const res = googleai.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        topP,
        topK,
        maxOutputTokens: maxTokens
      }
    })

    if (!stream) {
      const genContent = await res.generateContent(
        buildGoogleGenAIPrompt(messages)
      )
      return NextResponse.json(buildGoogleGenAIMessages(genContent))
    }

    const resStream = await res.generateContentStream(
      buildGoogleGenAIPrompt(messages)
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
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
