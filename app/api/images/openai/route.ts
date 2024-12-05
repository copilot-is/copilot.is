import { NextResponse } from 'next/server';
import OpenAI, { AzureOpenAI } from 'openai';
import { type ImagesResponse } from 'openai/resources/images';

import { appConfig } from '@/lib/appconfig';
import { streamImage } from '@/lib/streams/stream-image';
import { ImagePart, Message, TextPart } from '@/lib/types';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function extractContent(res: ImagesResponse) {
  const data: Array<TextPart | ImagePart> = [];

  for (let i = 0; i < res.data.length; i++) {
    const item = res.data[i];

    if (item.url) {
      data.push({
        type: 'image',
        image: item.url
      });
    }

    if (item.b64_json) {
      data.push({
        type: 'image',
        image: `data:image/png;base64,${item.b64_json}`
      });
    }

    if (item.revised_prompt) {
      data.push({
        type: 'text',
        text: item.revised_prompt
      });
    }
  }

  return data;
}

type PostData = {
  messages: Message[];
  model: string;
  stream: boolean;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!appConfig.openai.enabled) {
    return NextResponse.json({ error: 'OpenAI is disabled' }, { status: 403 });
  }

  const json: PostData = await req.json();
  const { messages, model, stream } = json;

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

    const prompt = messages[messages.length - 1].content.toString();
    const images = await openai.images.generate({
      model: provider === 'azure' ? '' : model,
      prompt,
      response_format: 'b64_json'
    });

    if (!stream) {
      return NextResponse.json(extractContent(images));
    }

    const res = streamImage(images);

    return res.toDataStreamResponse();
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
