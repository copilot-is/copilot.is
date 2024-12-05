import { NextResponse } from 'next/server';
import OpenAI, { AzureOpenAI } from 'openai';

import { appConfig } from '@/lib/appconfig';
import { Voices } from '@/lib/constant';
import { Voice } from '@/lib/types';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PostData = {
  model: string;
  input: string;
  voice: Voice;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!appConfig.tts.enabled) {
    return NextResponse.json({ error: 'TTS is disabled' }, { status: 403 });
  }

  const json: PostData = await req.json();
  const { model, input, voice } = json;

  if (!model || !input || !voice || !Voices.includes(voice)) {
    return NextResponse.json(
      { error: 'Invalid model input and voice parameters' },
      { status: 400 }
    );
  }

  try {
    const provider = appConfig.openai.provider;
    let openai;

    if (provider === 'azure') {
      openai = new AzureOpenAI({
        apiKey: appConfig.azure.apiKey,
        endpoint: appConfig.azure.baseURL,
        deployment: model,
        apiVersion: '2024-08-01-preview'
      });
    } else {
      openai = new OpenAI({
        apiKey: appConfig.openai.apiKey,
        baseURL: appConfig.openai.baseURL
      });
    }

    const res = await openai.audio.speech.create({
      model: provider === 'azure' ? '' : model,
      voice,
      input,
      response_format: 'mp3'
    });
    const buffer = Buffer.from(await res.arrayBuffer());

    return NextResponse.json({
      type: 'audio',
      audio: `data:audio/mp3;base64,${buffer.toString('base64')}`
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
