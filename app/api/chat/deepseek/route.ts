import { NextResponse } from 'next/server';
import { createDeepSeek } from '@ai-sdk/deepseek';
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

  if (!env.DEEPSEEK_ENABLED) {
    return NextResponse.json(
      { error: 'DeepSeek is disabled' },
      { status: 403 }
    );
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
    const deepseek = createDeepSeek({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: env.DEEPSEEK_BASE_URL
    });

    const parameters = {
      model: deepseek(model),
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
