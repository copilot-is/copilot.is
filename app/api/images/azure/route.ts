import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { ImagesResponse } from 'openai/resources';

import { appConfig } from '@/lib/appconfig';
import { streamImage } from '@/lib/streams/stream-image';
import {
  APIConfig,
  ImagePart,
  Message,
  TextPart,
  type Usage
} from '@/lib/types';
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
  usage: Usage;
  config?: APIConfig;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { messages, usage, config } = json;
  const { model, stream } = usage;

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
    const prompt = messages[messages.length - 1].content.toString();
    const images = await openai.images.generate({
      model: '',
      prompt,
      response_format: 'b64_json'
    });

    if (!stream) {
      return NextResponse.json(extractContent(images));
    }

    const res = streamImage(images);

    return res.toDataStreamResponse();
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
