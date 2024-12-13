import { NextResponse } from 'next/server';
import { createXai } from '@ai-sdk/xai';
import { generateText, streamText } from 'ai';

import { env } from '@/lib/env';
import { Message, type Usage } from '@/lib/types';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PostData = Usage & {
  messages: Message[];
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!env.XAI_ENABLED) {
    return NextResponse.json({ error: 'xAI is disabled' }, { status: 403 });
  }

  const json: PostData = await req.json();
  const {
    messages,
    model,
    stream,
    prompt,
    temperature,
    frequencyPenalty,
    presencePenalty,
    maxTokens
  } = json;

  try {
    const xai = createXai({
      apiKey: env.XAI_API_KEY,
      baseURL: env.XAI_BASE_URL
    });

    const parameters = {
      model: xai(model),
      system: prompt,
      messages,
      temperature,
      frequencyPenalty,
      presencePenalty,
      maxTokens
    };

    if (!stream) {
      const { text } = await generateText(parameters);

      return NextResponse.json({
        role: 'assistant',
        content: text
      });
    }

    const res = streamText(parameters);

    return res.toDataStreamResponse({
      getErrorMessage: error => {
        if (error == null) {
          return 'Unknown error';
        }

        if (typeof error === 'string') {
          return error;
        }

        if (error instanceof Error) {
          return error.message;
        }

        return JSON.stringify(error);
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
