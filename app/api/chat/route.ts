import { NextResponse } from 'next/server';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  smoothStream,
  stepCountIs,
  streamText
} from 'ai';

import { ChatMessage, MessageMetadata } from '@/types';
import { getLanguageModel } from '@/lib/provider';
import {
  findModelByModelId,
  getSystemPrompt,
  getTitleSettings
} from '@/lib/queries';
import { convertToChatMessages, formatString, generateUUID } from '@/lib/utils';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const maxDuration = 60;

type PostData = {
  id: string;
  modelId: string;
  userMessage: Omit<ChatMessage, 'role'> & { role: 'user' };
  parentMessageId?: string;
  isReasoning?: boolean;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const id = json.id || generateUUID();
  const { modelId, userMessage, parentMessageId, isReasoning } = json;

  if (!modelId || !userMessage) {
    return NextResponse.json(
      { error: 'Invalid modelId and userMessage parameters' },
      { status: 400 }
    );
  }

  // Fetch model from database to validate
  const dbModel = await findModelByModelId(modelId, 'chat');
  if (!dbModel?.provider) {
    return NextResponse.json(
      { error: `Model ${modelId} is not available` },
      { status: 403 }
    );
  }

  let title = 'Untitled';
  const chat = await api.chat.detail({
    id,
    type: 'chat',
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
      modelId,
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
    const historyMessages = await api.message.list({ chatId: id });
    const chatMessages = [
      ...convertToChatMessages(historyMessages),
      userMessage
    ];

    const provider = dbModel.provider;

    // Build system prompt (only if configured)
    const systemPromptContent = await getSystemPrompt(dbModel.systemPromptId);
    const systemMessage = systemPromptContent
      ? formatString(systemPromptContent, {
          provider: provider.name || '',
          modelId,
          date: new Date().toISOString()
        })
      : undefined;

    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        writer.write({ type: 'data-chat', data: { title } });

        const res = streamText({
          model: getLanguageModel(provider, modelId),
          ...(systemMessage && { system: systemMessage }),
          messages: await convertToModelMessages(chatMessages),
          ...(provider.apiOptions && {
            providerOptions: {
              [provider.type]: provider.apiOptions
            } as any
          }),
          temperature: dbModel.apiParams?.temperature,
          topP: dbModel.apiParams?.topP,
          topK: dbModel.apiParams?.topK,
          maxOutputTokens: dbModel.apiParams?.maxOutputTokens,
          frequencyPenalty: dbModel.apiParams?.frequencyPenalty,
          presencePenalty: dbModel.apiParams?.presencePenalty,
          stopWhen: stepCountIs(5),
          experimental_transform: smoothStream({ chunking: 'word' }),
          onChunk: ({ chunk }) => {
            if (chunk.type === 'tool-call') {
              console.log('Called Tool: ', chunk.toolName);
            }
            if (chunk.type === 'reasoning-delta') {
              console.log('Reasoning: ', chunk.text);
            }
          },
          onStepFinish: ({ warnings }) => {
            if (warnings) {
              console.log('Warnings: ', warnings);
            }
          },
          onFinish: async ({ usage }) => {
            if (usage) {
              console.log('Usage: ', usage);
            }
          }
        });

        res.consumeStream();

        writer.merge(
          res.toUIMessageStream({
            sendReasoning: isReasoning,
            messageMetadata: ({ part }) => {
              if (part.type === 'start') {
                const now = new Date();
                const messageMetadata: MessageMetadata = {
                  parentId: userMessage.id,
                  createdAt: now,
                  updatedAt: now
                };
                return messageMetadata;
              }
            }
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ responseMessage }) => {
        await api.message.create({
          chatId: id,
          messages: [responseMessage]
        });

        // Update chat model if changed
        if (chat && chat.modelId !== modelId) {
          try {
            await api.chat.update({
              id,
              modelId
            });
          } catch (err) {
            console.warn('Unable to update chat', id, err);
          }
        }
      },
      onError: error => {
        if (error == null) {
          return 'Unknown error';
        }

        if (typeof error === 'string') {
          return error;
        }

        if (error instanceof Error) {
          return error.message;
        }

        return JSON.stringify(error);
      }
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
