import { NextResponse } from 'next/server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';

import { appConfig } from '@/lib/appconfig';
import { Message, type Usage } from '@/lib/types';
import { chatId } from '@/lib/utils';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const dynamic = 'force-dynamic';
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

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { title = 'Untitled', messages, generateId, usage } = json;
  const {
    model,
    stream,
    prompt,
    previewToken,
    temperature = 1,
    topP = 1,
    topK = 1,
    maxTokens = 4096
  } = usage;

  try {
    const anthropic = createAnthropic({
      apiKey:
        !appConfig.anthropic.apiKey && previewToken
          ? previewToken
          : appConfig.anthropic.apiKey,
      baseURL: appConfig.anthropic.baseURL
    });

    const parameters = {
      model: anthropic(model, { topK }),
      system: prompt,
      messages,
      temperature,
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
      async onFinish({ text }) {
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
            topP,
            maxTokens
          }
        };
        await api.chat.create.mutate(payload);
      }
    });

    return res.toAIStreamResponse();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
