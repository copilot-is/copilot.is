import { NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';

import { appConfig } from '@/lib/appconfig';
import { APIConfig, Message, type Usage } from '@/lib/types';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PostData = {
  messages: Message[];
  usage: Usage;
  config?: APIConfig;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { messages, usage, config } = json;
  const {
    model,
    stream,
    prompt,
    temperature,
    frequencyPenalty,
    presencePenalty,
    maxTokens
  } = usage;

  try {
    const customEnabled = appConfig.apiCustomEnabled && config && config.token;

    const google = createGoogleGenerativeAI({
      apiKey: customEnabled ? config.token : appConfig.google.apiKey,
      baseURL:
        customEnabled && config.baseURL
          ? config.baseURL
          : appConfig.google.baseURL
    });

    const parameters = {
      model: google('models/' + model),
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
