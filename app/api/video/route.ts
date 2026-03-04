import path from 'path';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generateText, experimental_generateVideo as generateVideo } from 'ai';

import { ChatMessage } from '@/types';
import { env } from '@/lib/env';
import { getLanguageModel, getVideoModel } from '@/lib/provider';
import { findModelByModelId, getTitleSettings } from '@/lib/queries';
import { generateUUID } from '@/lib/utils';
import { generateWithSora } from '@/lib/video-generation';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const maxDuration = 60;

type PostData = {
  id: string;
  modelId: string;
  userMessage: Omit<ChatMessage, 'role'> & { role: 'user' };
  parentMessageId?: string;
  aspectRatio?: `${number}:${number}`;
  resolution?: string;
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
    modelId,
    userMessage,
    parentMessageId,
    aspectRatio = '16:9',
    resolution,
    duration
  } = json;

  if (!modelId || !userMessage) {
    return NextResponse.json(
      { error: 'Invalid modelId and userMessage parameters' },
      { status: 400 }
    );
  }

  // Fetch model from database to validate
  const dbModel = await findModelByModelId(modelId, 'video');
  if (!dbModel?.provider) {
    return NextResponse.json(
      { error: `Model ${modelId} is not available` },
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
      type: 'video',
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

    let videoBuffer: Buffer;
    let videoMediaType: string;

    // Fallback for Sora models since they are not supported by AI SDK yet
    if (modelId.includes('sora')) {
      const result = await generateWithSora(
        modelId,
        textParts,
        dbModel.provider,
        aspectRatio,
        resolution,
        duration
      );
      videoBuffer = result.buffer;
      videoMediaType = result.mediaType;
    } else {
      const providerOpts = {
        ...dbModel.provider.apiOptions,
        ...(resolution && { resolution })
      };
      const { video } = await generateVideo({
        model: getVideoModel(dbModel.provider, modelId),
        prompt: textParts,
        aspectRatio,
        duration,
        ...(Object.keys(providerOpts).length > 0 && {
          providerOptions: {
            [dbModel.provider.type]: providerOpts
          } as any
        })
      });
      videoBuffer = Buffer.from(video.uint8Array);
      videoMediaType = 'video/mp4';
    }

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
      modelId,
      assistantMessage
    });
  } catch (err: any) {
    console.error('Video generation error:', err);
    return NextResponse.json(
      { error: 'Oops, an error occurred!' },
      { status: 500 }
    );
  }
}
