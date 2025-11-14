import path from 'path';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import {
  experimental_generateImage as generateImage,
  generateText,
  JSONValue
} from 'ai';

import { ChatMessage } from '@/types';
import { GenerateTitlePrompt } from '@/lib/constant';
import { env } from '@/lib/env';
import { provider } from '@/lib/provider';
import { generateUUID, isAvailableModel } from '@/lib/utils';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const maxDuration = 60;

type PostData = {
  id: string;
  model: string;
  userMessage: Omit<ChatMessage, 'role'> & { role: 'user' };
  parentMessageId?: string;
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
  const id = json.id || generateUUID();
  const {
    model,
    userMessage,
    parentMessageId,
    n = 1,
    size,
    aspectRatio = '16:9',
    seed,
    providerOptions
  } = json;

  if (!model || !userMessage) {
    return NextResponse.json(
      { error: 'Invalid model and userMessage parameters' },
      { status: 400 }
    );
  }

  if (!isAvailableModel('image', model)) {
    return NextResponse.json(
      { error: `Model ${model} is not available` },
      { status: 403 }
    );
  }

  let title = 'Untitled';
  const chat = await api.chat.detail.query({
    id,
    type: 'image',
    includeMessages: false
  });
  if (!chat) {
    try {
      const { text } = await generateText({
        model: provider.languageModel(env.GENERATE_TITLE_MODEL),
        system: GenerateTitlePrompt,
        prompt: JSON.stringify(userMessage)
      });

      title = text ?? title;
    } catch (err: any) {
      console.error(
        `Generate title ${env.GENERATE_TITLE_MODEL} error:`,
        err.message
      );
    }

    await api.chat.create.mutate({
      id,
      title,
      type: 'image',
      model,
      messages: [userMessage]
    });
  } else {
    title = chat.title;
    if (parentMessageId && parentMessageId === userMessage.id) {
      await api.message.delete.mutate({ parentId: parentMessageId });
    } else {
      await api.message.create.mutate({
        chatId: id,
        messages: [userMessage]
      });
    }
  }

  try {
    const textParts = userMessage.parts
      ?.filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n')
      .trim();
    const { image } = await generateImage({
      model: provider.imageModel(model),
      prompt: textParts,
      n,
      size,
      aspectRatio,
      seed,
      providerOptions
    });

    const buffer = Buffer.from(image.base64, 'base64');
    const ext = image.mediaType?.split('/')[1] || 'png';
    const filename = `${generateUUID()}.${ext}`;

    const pathname = path.join(
      env.UPLOAD_PATH,
      'generate-images',
      session.user.id,
      filename
    );
    const data = await put(pathname, buffer, {
      access: 'public',
      contentType: image.mediaType,
      addRandomSuffix: false
    });

    const assistantNow = new Date();
    const assistantMessage: ChatMessage = {
      id: generateUUID(),
      role: 'assistant',
      parts: [
        {
          type: 'file',
          mediaType: data.contentType || image.mediaType,
          url: data.url,
          filename
        }
      ],
      metadata: {
        parentId: userMessage.id,
        createdAt: assistantNow,
        updatedAt: assistantNow
      }
    };

    await api.message.create.mutate({
      chatId: id,
      messages: [assistantMessage]
    });

    return NextResponse.json({
      id,
      title,
      type: 'image',
      model,
      assistantMessage
    });
  } catch (err) {
    console.error('Image generation error:', err);
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}
