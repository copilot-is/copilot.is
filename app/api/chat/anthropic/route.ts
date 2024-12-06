import { NextResponse } from 'next/server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { createAnthropicVertex } from 'anthropic-vertex';

import { appConfig } from '@/lib/appconfig';
import { VertexAIModels } from '@/lib/constant';
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

  if (!appConfig.anthropic.enabled) {
    return NextResponse.json(
      { error: 'Anthropic is disabled' },
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
    const provider = appConfig.anthropic.provider;
    let languageModel;

    if (provider === 'vertex') {
      const vertex = createAnthropicVertex({
        project: appConfig.vertex.project,
        location: appConfig.vertex.location,
        googleAuthOptions: {
          credentials: JSON.parse(appConfig.vertex.credentials || '{}')
        }
      });
      languageModel = vertex(VertexAIModels[model] || model);
    } else {
      const anthropic = createAnthropic({
        apiKey: appConfig.anthropic.apiKey,
        baseURL: appConfig.anthropic.baseURL
      });
      languageModel = anthropic(model);
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
