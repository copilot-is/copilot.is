import { NextResponse } from 'next/server';
import OpenAI from 'openai';

import { appConfig } from '@/lib/appconfig';
import { type Usage } from '@/lib/types';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: appConfig.openai.apiKey,
  baseURL: appConfig.openai.baseURL
});

const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
type Voice = (typeof voices)[number];

type PostData = {
  input: string;
  voice: Voice;
  usage: Usage;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { input, voice, usage } = json;
  const { model, previewToken } = usage;

  if (!model || !input || !voice || !voices.includes(voice)) {
    return NextResponse.json(
      { error: 'Invalid model input and voice parameters' },
      { status: 400 }
    );
  }

  if (appConfig.allowCustomAPIKey && previewToken) {
    openai.apiKey = previewToken;
  }

  try {
    const mp3 = await openai.audio.speech.create({
      model,
      input,
      voice,
      response_format: 'mp3'
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());

    return NextResponse.json({
      type: 'audio',
      audio: buffer.toString('base64')
    });
  } catch (err: any) {
    if (err instanceof OpenAI.APIError) {
      const status = err.status;
      const error = err.error as Record<string, any>;
      return NextResponse.json({ error: error.message }, { status });
    } else {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}
