import { NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex';
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

  if (!appConfig.google.enabled) {
    return NextResponse.json(
      { error: 'Google AI is disabled' },
      { status: 403 }
    );
  }

  const json: PostData = await req.json();
  const { messages, usage } = json;
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
    const provider = appConfig.openai.provider;
    let languageModel;

    if (provider === 'vertex') {
      const vertex = createVertex({
        project: appConfig.vertex.project,
        location: appConfig.vertex.location,
        googleAuthOptions: {
          credentials: JSON.parse(appConfig.vertex.credentials || '{}')
        }
      });
      languageModel = vertex(model);
    } else {
      const google = createGoogleGenerativeAI({
        apiKey: appConfig.google.apiKey,
        baseURL: appConfig.google.baseURL
      });
      languageModel = google('models/' + model);
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

    const res = await streamText(parameters);

    return res.toDataStreamResponse();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
