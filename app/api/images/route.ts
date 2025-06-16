import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { experimental_generateImage as generateImage, JSONValue } from 'ai';

import { provider } from '@/lib/provider';
import { generateUUID, isAvailableModel } from '@/lib/utils';
import { auth } from '@/server/auth';

export const maxDuration = 60;

type PostData = {
  model: string;
  prompt: string;
  n?: number;
  size?: `${number}x${number}`;
  aspectRatio?: `${number}:${number}`;
  seed?: number;
  providerOptions?: Record<string, Record<string, JSONValue>>;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const {
    model,
    prompt,
    n = 1,
    size = '1024x1024',
    aspectRatio = '16:9',
    seed,
    providerOptions
  } = json;

  if (!model || !prompt) {
    return NextResponse.json(
      { error: 'Prompt and model required' },
      { status: 400 }
    );
  }

  if (!isAvailableModel(model)) {
    return NextResponse.json(
      { error: `Model ${model} is not available` },
      { status: 403 }
    );
  }

  try {
    const { image } = await generateImage({
      model: provider.imageModel(model),
      prompt,
      n,
      size,
      aspectRatio,
      seed,
      providerOptions
    });

    const buffer = Buffer.from(image.base64, 'base64');
    const pathname = `generate-images/${session.user.id}/${generateUUID()}`;
    const data = await put(pathname, buffer, {
      access: 'public',
      contentType: image.mimeType
    });

    return NextResponse.json({
      type: 'image',
      image: data.url,
      mimeType: data.contentType
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}
