import { NextRequest, NextResponse } from 'next/server';
import { UIMessage } from '@ai-sdk/ui-utils';
import {
  appendResponseMessages,
  createDataStreamResponse,
  generateText,
  smoothStream,
  streamText
} from 'ai';

import { GenerateTitlePrompt, SystemPrompt } from '@/lib/constant';
import { env } from '@/lib/env';
import { provider } from '@/lib/provider';
import {
  generateUUID,
  getMostRecentUserMessage,
  isAvailableModel,
  systemPrompt
} from '@/lib/utils';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export const maxDuration = 60;

type PostData = {
  id: string;
  model: string;
  messages: UIMessage[];
  parentMessageId?: string;
  isReasoning: boolean;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { id, model, messages, parentMessageId, isReasoning } = json;

  if (!id || !model) {
    return NextResponse.json(
      { error: 'ID and model required' },
      { status: 400 }
    );
  }

  if (!isAvailableModel(model)) {
    return NextResponse.json(
      { error: `Model ${model} is not available` },
      { status: 403 }
    );
  }

  const userMessage = getMostRecentUserMessage(messages);
  if (!userMessage) {
    return NextResponse.json(
      { error: 'No user message found' },
      { status: 400 }
    );
  }

  let title = 'Untitled';
  const chat = await api.chat.detail.query({ id, includeMessages: false });
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
    return createDataStreamResponse({
      execute: dataStream => {
        dataStream.writeData(title);

        const res = streamText({
          model: provider.languageModel(model),
          system: systemPrompt(model, SystemPrompt),
          messages,
          maxSteps: 5,
          experimental_generateMessageId: generateUUID,
          experimental_transform: smoothStream({
            chunking: 'word',
            delayInMs: 15
          }),
          onChunk: ({ chunk }) => {
            if (chunk.type === 'tool-call') {
              console.log('Called Tool: ', chunk.toolName);
            }
            if (chunk.type === 'reasoning') {
              console.log('Reasoning: ', chunk.textDelta);
            }
          },
          onStepFinish: ({ warnings }) => {
            if (warnings) {
              console.log('Warnings: ', warnings);
            }
          },
          onFinish: async ({ response }) => {
            if (chat && chat.model !== model) {
              await api.chat.update.mutate({ id, model });
            }

            const [, assistantMessage] = appendResponseMessages({
              messages: [userMessage],
              responseMessages: response.messages
            });

            await api.message.create.mutate({
              chatId: id,
              messages: [
                {
                  id: assistantMessage.id,
                  parentId: userMessage.id,
                  role: assistantMessage.role,
                  content: assistantMessage.content,
                  parts: isReasoning
                    ? assistantMessage.parts || []
                    : (assistantMessage.parts || []).filter(
                        part => part.type !== 'reasoning'
                      ),
                  experimental_attachments:
                    assistantMessage.experimental_attachments ?? []
                }
              ]
            });
          }
        });

        res.consumeStream();

        res.mergeIntoDataStream(dataStream, {
          sendUsage: true,
          sendReasoning: isReasoning
        });
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
