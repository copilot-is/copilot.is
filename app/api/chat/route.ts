import OpenAI from 'openai'
import { type ChatCompletion } from 'openai/resources'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  type Message,
  OpenAIStream,
  GoogleGenerativeAIStream,
  StreamingTextResponse
} from 'ai'
import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import {
  nanoid,
  buildOpenAIUsage,
  buildGoogleGenAIUsage,
  buildOpenAIPrompt,
  buildGoogleGenAIPrompt,
  buildGoogleGenAIMessages,
  buildOpenAIMessages
} from '@/lib/utils'
import { type Chat, Usage } from '@/lib/types'
import { addChat } from '@/app/actions'
import { SupportedModels } from '@/lib/constant'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL
})

const googleai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')

type PostData = {
  id?: string
  title?: string
  generateId: string
  stream?: boolean
  previewToken?: string
  messages: Message[]
  usage: Usage
}

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user.id
  const json = await req.json()
  const { title = 'New Chat', messages, generateId, usage } = json as PostData
  const {
    model,
    stream,
    prompt,
    previewToken,
    frequencyPenalty = 0,
    presencePenalty = 0,
    temperature = 0.5,
    topP = 1,
    topK = 1
  } = usage
  const provider = SupportedModels.find(m => m.value === model)?.provider

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (provider === 'openai') {
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
        top_p: topP
      })

      if (!stream) {
        const response = await res.asResponse()
        const data = await response.json()
        return NextResponse.json(buildOpenAIMessages(data as ChatCompletion))
      }

      const resStream = await res.asResponse()
      const aiStream = OpenAIStream(resStream, {
        async onCompletion(completion) {
          const id = json.id ?? nanoid()
          const createdAt = Date.now()
          const path = `/chat/${id}`
          const payload: Chat = {
            id,
            path,
            title,
            userId,
            createdAt,
            messages: [
              ...messages,
              {
                id: generateId,
                content: completion,
                role: 'assistant'
              }
            ],
            usage: buildOpenAIUsage(usage)
          }
          await addChat(payload)
        }
      })

      return new StreamingTextResponse(aiStream)
    } catch (err) {
      if (err instanceof OpenAI.APIError) {
        const status = err.status
        const error = err.error as Record<string, any>
        return NextResponse.json(
          { status, ...error },
          { status, statusText: error?.message }
        )
      } else {
        throw err
      }
    }
  }

  if (provider === 'google') {
    if (!googleai.apiKey && previewToken) {
      googleai.apiKey = previewToken
    }

    try {
      const res = googleai.getGenerativeModel({
        model,
        generationConfig: {
          temperature,
          topP,
          topK
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
          const createdAt = Date.now()
          const path = `/chat/${id}`
          const payload: Chat = {
            id,
            path,
            title,
            userId,
            createdAt,
            messages: [
              ...messages,
              {
                id: generateId,
                content: completion,
                role: 'assistant'
              }
            ],
            usage: buildGoogleGenAIUsage(usage)
          }
          await addChat(payload)
        }
      })

      return new StreamingTextResponse(aiStream)
    } catch (err: any) {
      if (err && err.message.startsWith('[GoogleGenerativeAI Error]')) {
        const status = 500
        const message = err.message.replace('[GoogleGenerativeAI Error]: ', '')
        return NextResponse.json(
          { status, message },
          { status, statusText: message }
        )
      } else {
        throw err
      }
    }
  }
}
