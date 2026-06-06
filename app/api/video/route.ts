import path from 'path';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generateText, experimental_generateVideo as generateVideo } from 'ai';

import { ChatMessage } from '@/types';
import { env } from '@/lib/env';
import { preflightGate } from '@/lib/preflight';
import {
  bindingsToFailoverProviders,
  getLanguageModel,
  getVideoModel,
  runWithProviderFailover
} from '@/lib/provider';
import { findModelByModelId, getTitleSettings } from '@/lib/queries';
import { recordVideoUsage } from '@/lib/usage';
import { generateUUID } from '@/lib/utils';
import { generateWithSora } from '@/lib/video-generation';
import { resolveVideoSeconds } from '@/lib/video-usage';
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
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Fetch model from database to validate
  const dbModel = await findModelByModelId(modelId, 'video');
  const candidates = bindingsToFailoverProviders(dbModel?.providers ?? []);
  if (!dbModel || candidates.length === 0) {
    console.error(`[video] model unavailable: ${modelId}`);
    return NextResponse.json(
      {
        error:
          'This model is currently unavailable. Please choose a different model.'
      },
      { status: 403 }
    );
  }

  const gate = await preflightGate({
    userId: session.user.id,
    modelKey: dbModel.modelId,
    modelLabel: dbModel.name,
    capability: 'video'
  });
  if (gate) return gate;

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

    const { result, provider: usedProvider } = await runWithProviderFailover(
      candidates,
      async provider => {
        let videoBuffer: Buffer;
        let videoMediaType: string;
        // Billable duration in seconds — actual generated length when the
        // provider reports it, else the requested duration.
        let videoSeconds: number | undefined;

        // Sora has no AI SDK support yet — use the custom path.
        if (modelId.includes('sora')) {
          const soraResult = await generateWithSora(
            modelId,
            textParts,
            provider,
            aspectRatio,
            resolution,
            duration
          );
          videoBuffer = soraResult.buffer;
          videoMediaType = soraResult.mediaType;
          // Sora returns no duration metadata — bill the requested duration.
          videoSeconds = typeof duration === 'number' ? duration : undefined;
        } else {
          const providerOpts = {
            ...provider.apiOptions,
            ...(resolution && { resolution })
          };
          const { video, providerMetadata } = await generateVideo({
            model: getVideoModel(provider, modelId),
            prompt: textParts,
            aspectRatio,
            duration,
            ...(Object.keys(providerOpts).length > 0 && {
              providerOptions: {
                [provider.type]: providerOpts
              } as any
            })
          });
          videoBuffer = Buffer.from(video.uint8Array);
          videoMediaType = 'video/mp4';
          videoSeconds = resolveVideoSeconds(providerMetadata, duration);
        }

        return { videoBuffer, videoMediaType, videoSeconds };
      }
    );

    const { videoBuffer, videoMediaType, videoSeconds } = result;

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

    await recordVideoUsage({
      userId: session.user.id,
      chatId: id,
      messageId: assistantMessage.id,
      modelId,
      providerId: usedProvider.id,
      videoCount: 1,
      videoSeconds
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
