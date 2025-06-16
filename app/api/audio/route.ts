import { NextResponse } from 'next/server';

import { Voice } from '@/types';
import { Voices } from '@/lib/constant';
import { env } from '@/lib/env';
import { generateSpeech } from '@/lib/provider';
import { isAvailableModel } from '@/lib/utils';
import { auth } from '@/server/auth';

export const maxDuration = 60;

type PostData = {
  model: string;
  input: string;
  voice?: Voice;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { model, input, voice } = json;

  if (!model || !input) {
    return NextResponse.json(
      { error: 'Invalid model and input parameters' },
      { status: 400 }
    );
  }

  if (!env.TTS_ENABLED || !isAvailableModel(model)) {
    return NextResponse.json(
      { error: `Model ${model} is not available` },
      { status: 403 }
    );
  }

  if (voice && !Voices.includes(voice)) {
    return NextResponse.json(
      { error: 'Invalid voice parameters' },
      { status: 400 }
    );
  }

  try {
    const res = await generateSpeech({ model, input, voice });
    const buffer = Buffer.from(await res.arrayBuffer());

    return NextResponse.json({
      type: 'audio',
      audio: `data:audio/mp3;base64,${buffer.toString('base64')}`,
      mimeType: 'audio/mp3'
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}
