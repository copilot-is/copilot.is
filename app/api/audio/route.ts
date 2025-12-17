import path from 'path';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import {
  experimental_generateSpeech as generateSpeech,
  generateText,
  NoSpeechGeneratedError
} from 'ai';

import { ChatMessage, Voice } from '@/types';
import { GenerateTitlePrompt, Voices } from '@/lib/constant';
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
  voice?: Voice;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const id = json.id || generateUUID();
  const { model, userMessage, parentMessageId, voice } = json;

  if (!model || !userMessage) {
    return NextResponse.json(
      { error: 'Invalid model and userMessage parameters' },
      { status: 400 }
    );
  }

  if (!isAvailableModel('voice', model)) {
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

  let title = 'Untitled';
  const chat = await api.chat.detail({
    id,
    type: 'voice',
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
      type: 'voice',
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
    const { audio } = await generateSpeech({
      model: provider.speechModel('tts-1'),
      text: textParts,
      voice: voice || 'alloy',
      outputFormat: 'mp3'
    });

    const buffer = Buffer.from(audio.base64, 'base64');
    const filename = `${generateUUID()}.mp3`;
    const pathname = path.join(
      env.UPLOAD_PATH,
      'generate-audio',
      session.user.id,
      filename
    );
    const blobData = await put(pathname, buffer, {
      access: 'public',
      contentType: audio.mediaType,
      addRandomSuffix: false
    });

    const assistantNow = new Date();
    const assistantMessage: ChatMessage = {
      id: generateUUID(),
      role: 'assistant',
      parts: [
        {
          type: 'file',
          mediaType: blobData.contentType || audio.mediaType,
          url: blobData.url,
          filename: `audio-${Date.now()}.mp3`
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
      type: 'voice',
      model,
      assistantMessage
    });
  } catch (err) {
    console.error('Audio generation error:', err);
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
