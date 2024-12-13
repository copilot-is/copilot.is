import { NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { createOpenAI } from '@ai-sdk/openai';
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

  if (!env.OPENAI_ENABLED) {
    return NextResponse.json({ error: 'OpenAI is disabled' }, { status: 403 });
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
    const provider = env.OPENAI_API_PROVIDER;
    let languageModel;

    if (provider === 'azure') {
      const azure = createAzure({
        apiKey: env.AZURE_API_KEY,
        baseURL: env.AZURE_BASE_URL
          ? env.AZURE_BASE_URL + '/openai/deployments'
          : undefined
      });
      languageModel = azure(model);
    } else {
      const openai = createOpenAI({
        apiKey: env.OPENAI_API_KEY,
        baseURL: env.OPENAI_BASE_URL
      });
      languageModel = openai(model);
    }

    const parameters = {
      model: languageModel,
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
