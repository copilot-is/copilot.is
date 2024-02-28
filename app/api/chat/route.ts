import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  OpenAIStream,
  GoogleGenerativeAIStream,
  StreamingTextResponse
} from 'ai'
import { NextResponse } from 'next/server'

import { auth } from '@/server/auth'
import {
  nanoid,
  buildOpenAIUsage,
  buildGoogleGenAIUsage,
  buildOpenAIPrompt,
  buildGoogleGenAIPrompt,
  buildGoogleGenAIMessages,
  buildOpenAIMessages,
  providerFromModel
} from '@/lib/utils'
import { Message, type Usage } from '@/lib/types'
import { appConfig } from '@/lib/appconfig'
import { api } from '@/trpc/server'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: appConfig.openai.apiKey,
  baseURL: appConfig.openai.apiUrl
})

const googleai = new GoogleGenerativeAI(appConfig.google.apiKey)

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

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

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
  const provider = providerFromModel(model)

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
            usage: buildOpenAIUsage(usage)
          }
          await api.chat.create.mutate(payload)
        }
      })

      return new StreamingTextResponse(aiStream)
    } catch (err: any) {
      if (err instanceof OpenAI.APIError) {
        const status = err.status
        const error = err.error as Record<string, any>
        return new Response(error.message, {
          status: status,
          statusText: error.message
        })
      } else {
        return new Response(err.message, {
          status: 500,
          statusText: err.message
        })
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
            usage: buildGoogleGenAIUsage(usage)
          }
          await api.chat.create.mutate(payload)
        }
      })

      return new StreamingTextResponse(aiStream)
    } catch (err: any) {
      const message = err.message.replace('[GoogleGenerativeAI Error]: ', '')
      return new Response(message, {
        status: 500,
        statusText: message
      })
    }
  }
}
