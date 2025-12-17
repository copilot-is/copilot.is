import path from 'path';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generateText } from 'ai';

import { ChatMessage } from '@/types';
import { GenerateTitlePrompt } from '@/lib/constant';
import { env } from '@/lib/env';
import { provider } from '@/lib/provider';
import { generateUUID, isAvailableModel } from '@/lib/utils';
import { generateVideo } from '@/lib/video-generation';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const maxDuration = 60;

type PostData = {
  id: string;
  model: string;
  userMessage: Omit<ChatMessage, 'role'> & { role: 'user' };
  parentMessageId?: string;
  aspectRatio?: `${number}:${number}`;
  duration?: number;
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
    aspectRatio = '16:9',
    duration
  } = json;

  if (!model || !userMessage) {
    return NextResponse.json(
      { error: 'Invalid model and userMessage parameters' },
      { status: 400 }
    );
  }

  if (!isAvailableModel('video', model)) {
    return NextResponse.json(
      { error: `Model ${model} is not available` },
      { status: 403 }
    );
  }

  let title = 'Untitled';
  const chat = await api.chat.detail({
    id,
    type: 'video',
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

    await api.chat.create({
      id,
      title,
      type: 'video',
      model,
      messages: [userMessage]
    });
  } else {
    title = chat.title;
    if (parentMessageId && parentMessageId === userMessage.id) {
      await api.message.delete({ parentId: parentMessageId });
    } else {
      await api.message.create({
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
    const { buffer: videoBuffer, mediaType: videoMediaType } =
      await generateVideo({
        model,
        prompt: textParts,
        aspectRatio,
        duration
      });

    const filename = `${generateUUID()}.mp4`;
    const pathname = path.join(
      env.UPLOAD_PATH,
      'generate-videos',
      session.user.id,
      filename
    );
    const data = await put(pathname, videoBuffer, {
      access: 'public',
      contentType: videoMediaType,
      addRandomSuffix: false
    });

    const assistantNow = new Date();
    const assistantMessage: ChatMessage = {
      id: generateUUID(),
      role: 'assistant',
      parts: [
        {
          type: 'file',
          mediaType: data.contentType || videoMediaType,
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

    await api.message.create({
      chatId: id,
      messages: [assistantMessage]
    });

    return NextResponse.json({
      id,
      title,
      type: 'video',
      model,
      assistantMessage
    });
  } catch (err: any) {
    console.error('Video generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}
