import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

import { appConfig } from '@/lib/appconfig';
import { Message, type Usage } from '@/lib/types';
import { chatId } from '@/lib/utils';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const runtime = 'edge';
export const maxDuration = 60;

type PostData = {
  id?: string;
  title?: string;
  generateId: string;
  messages: Message[];
  usage: Usage;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { title = 'Untitled', messages, generateId, usage } = json;
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
  } = usage;

  try {
    const openai = createOpenAI({
      apiKey:
        !appConfig.openai.apiKey && previewToken
          ? previewToken
          : appConfig.openai.apiKey,
      baseURL: appConfig.openai.baseURL
    });

    const parameters = {
      model: openai(model),
      system: prompt,
      messages,
      temperature,
      frequencyPenalty,
      presencePenalty,
      topP,
      maxTokens
    };

    if (!stream) {
      const { text } = await generateText(parameters);

      return NextResponse.json({
        role: 'assistant',
        content: text
      });
    }

    const res = await streamText({
      ...parameters,
      onFinish: async ({ text }) => {
        const id = json.id ?? chatId();
        const payload: any = {
          id,
          title,
          messages: [
            ...messages,
            {
              id: generateId,
              content: text,
              role: 'assistant'
            }
          ],
          usage: {
            model,
            temperature,
            frequencyPenalty,
            presencePenalty,
            topP,
            maxTokens
          }
        };
        await api.chat.create.mutate(payload);
      }
    });

    return res.toAIStreamResponse();
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
