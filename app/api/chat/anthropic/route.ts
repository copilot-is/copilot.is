import { NextResponse } from 'next/server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';

import { appConfig } from '@/lib/appconfig';
import { Message, type Usage } from '@/lib/types';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PostData = {
  messages: Message[];
  usage: Usage;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { messages, usage } = json;
  const {
    model,
    stream,
    prompt,
    previewToken,
    temperature,
    frequencyPenalty,
    presencePenalty,
    maxTokens
  } = usage;

  try {
    const anthropic = createAnthropic({
      apiKey:
        appConfig.allowCustomAPIKey && previewToken
          ? previewToken
          : appConfig.anthropic.apiKey,
      baseURL: appConfig.anthropic.baseURL
    });

    const parameters = {
      model: anthropic(model),
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

    const res = await streamText(parameters);

    return res.toDataStreamResponse();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
