import { NextResponse } from 'next/server';
import {
  experimental_generateSpeech as generateSpeech,
  NoSpeechGeneratedError
} from 'ai';

import { getSpeechModel } from '@/lib/provider';
import { findModelByModelId, getSpeechSettings } from '@/lib/queries';
import { auth } from '@/server/auth';

export const maxDuration = 60;

type PostData = {
  modelId?: string;
  text: string;
  voice?: string;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { modelId: requestModelId, text, voice: requestVoice } = json;

  if (!text) {
    return NextResponse.json(
      { error: 'Invalid text parameter' },
      { status: 400 }
    );
  }

  // Get speech settings
  const { speechEnabled, defaultModel, defaultVoice } =
    await getSpeechSettings();
  if (!speechEnabled) {
    return NextResponse.json(
      { error: 'Speech is not enabled' },
      { status: 403 }
    );
  }

  // Use default values if not provided
  const modelId = requestModelId || defaultModel;
  const voice = requestVoice || defaultVoice;

  if (!modelId) {
    return NextResponse.json(
      { error: 'Model is not configured' },
      { status: 400 }
    );
  }

  // Fetch model from database to validate
  const dbModel = await findModelByModelId(modelId, 'audio');
  if (!dbModel?.provider) {
    return NextResponse.json(
      { error: `Model ${modelId} is not available` },
      { status: 403 }
    );
  }

  // Validate voice against model's available voices
  const availableVoices = (dbModel.uiOptions?.voices as string[]) || [];
  if (voice && availableVoices.length > 0 && !availableVoices.includes(voice)) {
    return NextResponse.json(
      { error: 'Invalid voice parameters' },
      { status: 400 }
    );
  }

  try {
    const { audio } = await generateSpeech({
      model: getSpeechModel(dbModel.provider, modelId),
      text,
      voice,
      outputFormat: 'mp3',
      ...(dbModel.provider.apiOptions && {
        providerOptions: {
          [dbModel.provider.type]: dbModel.provider.apiOptions
        } as any
      })
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
        { error: 'Oops, an error occurred!' },
        { status: 500 }
      );
    }
  }
}
