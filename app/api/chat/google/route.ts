import { NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
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
    temperature = 0.5,
    topP = 1,
    topK = 40,
    maxTokens
  } = usage;

  try {
    const google = createGoogleGenerativeAI({
      apiKey:
        !appConfig.google.apiKey && previewToken
          ? previewToken
          : appConfig.google.apiKey,
      baseURL: appConfig.google.baseURL
    });

    const parameters = {
      model: google('models/' + model, { topK }),
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
            topK,
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
