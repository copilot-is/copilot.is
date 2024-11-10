import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

import { appConfig } from '@/lib/appconfig';
import { Voices } from '@/lib/constant';
import { APIConfig, Voice, type Usage } from '@/lib/types';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PostData = {
  input: string;
  voice: Voice;
  usage: Usage;
  config?: APIConfig;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { input, voice, usage, config } = json;
  const { model } = usage;

  if (!model || !input || !voice || !Voices.includes(voice)) {
    return NextResponse.json(
      { error: 'Invalid model input and voice parameters' },
      { status: 400 }
    );
  }

  const customEnabled = appConfig.apiCustomEnabled && config && config.token;
  const openai = new AzureOpenAI({
    apiKey: customEnabled ? config.token : appConfig.azure.apiKey,
    endpoint:
      customEnabled && config.baseURL
        ? config.baseURL
        : appConfig.azure.baseURL,
    deployment: model,
    apiVersion: '2024-08-01-preview'
  });

  try {
    const res = await openai.audio.speech.create({
      model: '',
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
    if (err instanceof AzureOpenAI.APIError) {
      const status = err.status;
      const error = err.error as Record<string, any>;
      return NextResponse.json({ error: error.message }, { status });
    } else {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}
