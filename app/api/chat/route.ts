import { NextRequest, NextResponse } from 'next/server';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  smoothStream,
  stepCountIs,
  streamText
} from 'ai';

import { ChatMessage, MessageMetadata, Usage } from '@/types';
import { GenerateTitlePrompt, SystemPrompt } from '@/lib/constant';
import { env } from '@/lib/env';
import { provider } from '@/lib/provider';
import {
  convertToChatMessages,
  generateUUID,
  isAvailableModel,
  systemPrompt
} from '@/lib/utils';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const maxDuration = 60;

type PostData = {
  id: string;
  model: string;
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
  const { model, userMessage, parentMessageId, isReasoning } = json;

  if (!model || !userMessage) {
    return NextResponse.json(
      { error: 'Invalid model and userMessage parameters' },
      { status: 400 }
    );
  }

  if (!isAvailableModel('chat', model)) {
    return NextResponse.json(
      { error: `Model ${model} is not available` },
      { status: 403 }
    );
  }

  let title = 'Untitled';
  const chat = await api.chat.detail.query({
    id,
    type: 'chat',
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
    const historyMessages = await api.message.list.query({ chatId: id });
    const chatMessages = [
      ...convertToChatMessages(historyMessages),
      userMessage
    ];

    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        writer.write({ type: 'data-chat', data: { title } });

        const res = streamText({
          model: provider.languageModel(model),
          system: systemPrompt(model, SystemPrompt),
          messages: convertToModelMessages(chatMessages),
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
        await api.message.create.mutate({
          chatId: id,
          messages: [responseMessage]
        });

        // Update chat model if changed
        if (chat && chat.model !== model) {
          try {
            await api.chat.update.mutate({
              id,
              model
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

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const data = await api.chat.list.query({ limit, offset });

    if (!data) {
      return NextResponse.json(
        { error: 'Chat history not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await api.chat.deleteAll.mutate();
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}
