import { NextResponse } from 'next/server';
import {
  experimental_generateSpeech as generateSpeech,
  NoSpeechGeneratedError
} from 'ai';

import { Voice } from '@/types';
import { Voices } from '@/lib/constant';
import { env } from '@/lib/env';
import { provider } from '@/lib/provider';
import { isAvailableModel } from '@/lib/utils';
import { auth } from '@/server/auth';

export const maxDuration = 60;

type PostData = {
  model: string;
  text: string;
  voice?: Voice;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { model, text, voice } = json;

  if (!model || !text) {
    return NextResponse.json(
      { error: 'Invalid model and text parameters' },
      { status: 400 }
    );
  }

  if (!env.SPEECH_ENABLED || !isAvailableModel('voice', model)) {
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
    const { audio } = await generateSpeech({
      model: provider.speechModel('tts-1'),
      text,
      voice: voice || 'alloy',
      outputFormat: 'mp3'
    });

    return NextResponse.json({
      type: 'audio',
      audio: `data:${audio.mediaType};base64,${audio.base64}`,
      mimeType: audio.mediaType
    });
  } catch (err) {
    if (NoSpeechGeneratedError.isInstance(err)) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: 'Oops, an error occured!' },
        { status: 500 }
      );
    }
  }
}
