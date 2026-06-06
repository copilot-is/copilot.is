import path from 'path';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generateImage, generateText } from 'ai';

import { ChatMessage } from '@/types';
import { env } from '@/lib/env';
import { preflightGate } from '@/lib/preflight';
import {
  bindingsToFailoverProviders,
  getImageModel,
  getLanguageModel,
  runWithProviderFailover
} from '@/lib/provider';
import { findModelByModelId, getTitleSettings } from '@/lib/queries';
import { recordImageUsage } from '@/lib/usage';
import { generateUUID } from '@/lib/utils';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const maxDuration = 60;

type PostData = {
  id: string;
  modelId: string;
  userMessage: Omit<ChatMessage, 'role'> & { role: 'user' };
  parentMessageId?: string;
  size?: `${number}x${number}` | '512' | '1K' | '2K' | '4K';
  aspectRatio?: `${number}:${number}`;
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
    size,
    aspectRatio = '16:9'
  } = json;

  if (!modelId || !userMessage) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Fetch model from database to validate
  const dbModel = await findModelByModelId(modelId, 'image');
  const candidates = bindingsToFailoverProviders(dbModel?.providers ?? []);
  if (!dbModel || candidates.length === 0) {
    console.error(`[images] model unavailable: ${modelId}`);
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
    capability: 'image'
  });
  if (gate) return gate;

  let title = 'Untitled';
  const chat = await api.chat.detail({
    id,
    type: 'image',
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
      type: 'image',
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
        let imageBase64: string;
        let imageMediaType: string;
        // Token counts for token-billed image models (e.g. gpt-image-1).
        // Undefined for per-image models — recordImageUsage falls back to
        // per-image pricing.
        let inputTokens: number | undefined;
        let outputTokens: number | undefined;

        // Gemini serves images via generateText (multi-modal); other providers
        // use the generateImage API.
        if (provider.type === 'google' && modelId.startsWith('gemini')) {
          const genResult = await generateText({
            model: getLanguageModel(provider, modelId),
            prompt: textParts,
            temperature: dbModel.apiParams?.temperature,
            topP: dbModel.apiParams?.topP,
            topK: dbModel.apiParams?.topK,
            maxOutputTokens: dbModel.apiParams?.maxOutputTokens,
            frequencyPenalty: dbModel.apiParams?.frequencyPenalty,
            presencePenalty: dbModel.apiParams?.presencePenalty,
            providerOptions: {
              [provider.type]: {
                ...provider.apiOptions,
                imageConfig: {
                  aspectRatio,
                  ...(size && { imageSize: size })
                }
              }
            } as any
          });

          const imageFile = genResult.files?.find(f =>
            f.mediaType.startsWith('image/')
          );
          if (!imageFile) {
            throw new Error('No image generated by the model');
          }

          imageBase64 = imageFile.base64;
          imageMediaType = imageFile.mediaType;
          inputTokens = genResult.usage?.inputTokens;
          outputTokens = genResult.usage?.outputTokens;
        } else {
          // Standard image models use generateImage API
          const standardSize = size?.includes('x')
            ? (size as `${number}x${number}`)
            : undefined;

          const { image, usage } = await generateImage({
            model: getImageModel(provider, modelId),
            prompt: textParts,
            n: 1,
            size: standardSize,
            aspectRatio,
            ...(provider.apiOptions && {
              providerOptions: {
                [provider.type]: provider.apiOptions
              } as any
            })
          });

          imageBase64 = image.base64;
          imageMediaType = image.mediaType;
          inputTokens = usage?.inputTokens;
          outputTokens = usage?.outputTokens;
        }

        return { imageBase64, imageMediaType, inputTokens, outputTokens };
      }
    );

    const { imageBase64, imageMediaType, inputTokens, outputTokens } = result;

    const buffer = Buffer.from(imageBase64, 'base64');
    const ext = imageMediaType?.split('/')[1] || 'png';
    const filename = `${generateUUID()}.${ext}`;

    const pathname = path.join(
      env.UPLOAD_PATH,
      'generate-images',
      session.user.id,
      filename
    );
    const data = await put(pathname, buffer, {
      access: 'public',
      contentType: imageMediaType,
      addRandomSuffix: false
    });

    const assistantNow = new Date();
    const assistantMessage: ChatMessage = {
      id: generateUUID(),
      role: 'assistant',
      parts: [
        {
          type: 'file',
          mediaType: data.contentType || imageMediaType,
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

    await recordImageUsage({
      userId: session.user.id,
      chatId: id,
      messageId: assistantMessage.id,
      modelId,
      providerId: usedProvider.id,
      imageCount: 1,
      inputTokens,
      outputTokens
    });

    return NextResponse.json({
      id,
      title,
      type: 'image',
      modelId,
      assistantMessage
    });
  } catch (err) {
    console.error('Image generation error:', err);
    return NextResponse.json(
      { error: 'Oops, an error occurred!' },
      { status: 500 }
    );
  }
}
