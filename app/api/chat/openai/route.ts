import { NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

import { appConfig } from '@/lib/appconfig';
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

  if (!appConfig.openai.enabled) {
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
    const provider = appConfig.openai.provider;
    let languageModel;

    if (provider === 'azure') {
      const azure = createAzure({
        apiKey: appConfig.azure.apiKey,
        baseURL: appConfig.azure.baseURL
          ? appConfig.azure.baseURL + '/openai/deployments'
          : undefined
      });
      languageModel = azure(model);
    } else {
      const openai = createOpenAI({
        apiKey: appConfig.openai.apiKey,
        baseURL: appConfig.openai.baseURL
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

    return res.toDataStreamResponse();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
