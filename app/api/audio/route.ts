import path from 'path';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import {
  experimental_generateSpeech as generateSpeech,
  generateText,
  NoSpeechGeneratedError
} from 'ai';

import { ChatMessage } from '@/types';
import { env } from '@/lib/env';
import { getLanguageModel, getSpeechModel } from '@/lib/provider';
import { findModelByModelId, getTitleSettings } from '@/lib/queries';
import { generateUUID } from '@/lib/utils';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const maxDuration = 60;

type PostData = {
  id: string;
  modelId: string;
  userMessage: Omit<ChatMessage, 'role'> & { role: 'user' };
  parentMessageId?: string;
  voice?: string;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const id = json.id || generateUUID();
  const { modelId, userMessage, parentMessageId, voice } = json;

  if (!modelId || !userMessage) {
    return NextResponse.json(
      { error: 'Invalid modelId and userMessage parameters' },
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

  let title = 'Untitled';
  const chat = await api.chat.detail({
    id,
    type: 'audio',
    includeMessages: false
  });

  if (!chat) {
    try {
      const {
        prompt: titlePrompt,
        modelId: titleModelId,
        provider: titleProvider
      } = await getTitleSettings();

      // Only generate title if all settings are configured
      if (titlePrompt && titleModelId && titleProvider) {
        const { text } = await generateText({
          model: getLanguageModel(titleProvider, titleModelId),
          system: titlePrompt,
          prompt: JSON.stringify(userMessage)
        });

        title = text ?? title;
      }
    } catch (err: any) {
      console.error(`Generate title error:`, err.message);
    }

    await api.chat.create({
      id,
      title,
      type: 'audio',
      modelId,
      messages: [userMessage]
    });
  } else {
    title = chat.title;
    // Update modelId if it has changed
    if (chat.modelId !== modelId) {
      await api.chat.update({ id, modelId });
    }
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
      model: getSpeechModel(dbModel.provider, modelId),
      text: textParts,
      voice,
      outputFormat: 'mp3',
      ...(dbModel.provider.apiOptions && {
        providerOptions: {
          [dbModel.provider.type]: dbModel.provider.apiOptions
        } as any
      })
    });

    const buffer = Buffer.from(audio.base64, 'base64');
    const filename = `${generateUUID()}.mp3`;
    const pathname = path.join(
      env.UPLOAD_PATH,
      'generate-audios',
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
      type: 'audio',
      modelId,
      assistantMessage
    });
  } catch (err) {
    console.error('Audio generation error:', err);
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
