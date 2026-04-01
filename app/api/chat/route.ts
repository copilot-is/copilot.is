import { NextResponse } from 'next/server';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  parsePartialJson,
  smoothStream,
  stepCountIs,
  streamText,
  tool
} from 'ai';
import { z } from 'zod';

import {
  artifactTypeSchema,
  ChatMessage,
  MessageMetadata,
  type Artifact
} from '@/types';
import { getLanguageModel } from '@/lib/provider';
import {
  findModelByModelId,
  getSystemPrompt,
  getTitleSettings
} from '@/lib/queries';
import { convertToChatMessages, formatString, generateUUID } from '@/lib/utils';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import {
  artifacts as artifactsTable,
  messages as messagesTable
} from '@/server/db/schema';
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
    const chatMessages = convertToChatMessages(historyMessages);

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
    const artifactSystemPrompt =
      'When you produce structured outputs such as code, long documents, or files, create an artifact using create_artifact. ' +
      'For non-file artifacts, include full content. For files/images, include fileUrl and mimeType.';

    let reasonStartedAt: Date | null = null;
    let reasonDuration = 0;
    const assistantMessageId = generateUUID();
    const completedArtifacts = new Map<string, Artifact>();
    const completedArtifactOrder: string[] = [];

    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        const emitArtifactDelta = (artifact: Artifact) => {
          writer.write({ type: 'data-id', data: artifact.id });
          const kind =
            artifact.type === 'image'
              ? 'image'
              : artifact.type === 'file'
                ? 'file'
                : artifact.type === 'json'
                  ? 'sheet'
                  : artifact.type === 'code' || artifact.type === 'html'
                    ? 'code'
                    : 'text';
          writer.write({
            type: 'data-title',
            data: { id: artifact.id, title: artifact.title }
          });
          writer.write({
            type: 'data-kind',
            data: {
              id: artifact.id,
              kind,
              artifactType: artifact.type
            }
          });
          writer.write({ type: 'data-clear', data: { id: artifact.id } });
          if (['code', 'json', 'html'].includes(artifact.type)) {
            writer.write({
              type: 'data-codeDelta',
              data: {
                id: artifact.id,
                title: artifact.title,
                delta: artifact.content ?? '',
                mode: 'replace',
                status: 'done',
                language: artifact.language ?? undefined,
                artifactType: artifact.type
              }
            });
            writer.write({ type: 'data-finish', data: { id: artifact.id } });
            return;
          }
          if (artifact.type === 'image' && artifact.fileUrl) {
            writer.write({
              type: 'data-imageDelta',
              data: {
                id: artifact.id,
                title: artifact.title,
                url: artifact.fileUrl,
                status: 'done',
                artifactType: artifact.type
              }
            });
            writer.write({ type: 'data-finish', data: { id: artifact.id } });
            return;
          }
          if (artifact.type === 'file' && artifact.fileUrl) {
            writer.write({
              type: 'data-fileDelta',
              data: {
                id: artifact.id,
                title: artifact.title,
                url: artifact.fileUrl,
                fileName: artifact.fileName ?? null,
                mimeType: artifact.mimeType ?? null,
                size: artifact.size ?? null,
                status: 'done',
                artifactType: artifact.type
              }
            });
            writer.write({ type: 'data-finish', data: { id: artifact.id } });
            return;
          }
          writer.write({
            type: 'data-textDelta',
            data: {
              id: artifact.id,
              title: artifact.title,
              delta: artifact.content ?? '',
              mode: 'replace',
              status: 'done',
              artifactType: artifact.type
            }
          });
          writer.write({ type: 'data-finish', data: { id: artifact.id } });
        };

        const createArtifactSchema = z.object({
          id: z.string().min(1).optional(),
          title: z.string().min(1),
          type: artifactTypeSchema,
          language: z.string().optional(),
          content: z.string().optional(),
          fileUrl: z.string().url().optional(),
          fileName: z.string().optional(),
          mimeType: z.string().optional(),
          size: z.number().int().nonnegative().optional()
        });
        type CreateArtifactInput = z.infer<typeof createArtifactSchema>;

        const assertArtifactPayload = (input: CreateArtifactInput) => {
          const isFileArtifact =
            input.type === 'image' || input.type === 'file';

          if (isFileArtifact) {
            if (!input.fileUrl) {
              throw new Error('fileUrl is required for file/image artifacts');
            }
            return;
          }

          if (input.content == null) {
            throw new Error('content is required for non-file artifacts');
          }
        };

        const createArtifactRecord = (
          input: CreateArtifactInput,
          artifactId: string
        ): Artifact => {
          const now = new Date();

          return {
            id: artifactId,
            chatId: id,
            messageId: assistantMessageId,
            title: input.title,
            type: input.type,
            language: input.language ?? null,
            content: input.content ?? null,
            fileUrl: input.fileUrl ?? null,
            fileName: input.fileName ?? null,
            mimeType: input.mimeType ?? null,
            size: input.size ?? null,
            status: 'done',
            createdAt: now,
            updatedAt: now
          };
        };

        type ToolArtifactStreamState = {
          artifactId: string;
          rawInput: string;
          started: boolean;
          lastTitle: string;
          lastKind: 'text' | 'code' | 'image' | 'sheet' | 'file';
          lastType?: CreateArtifactInput['type'];
          lastContent: string;
          lastUrl: string | null;
          lastFileName: string | null;
          lastMimeType: string | null;
          lastSize: number | null;
        };

        const toolArtifactStates = new Map<string, ToolArtifactStreamState>();

        const getArtifactKind = (
          type?: CreateArtifactInput['type']
        ): 'text' | 'code' | 'image' | 'sheet' | 'file' => {
          if (type === 'image') return 'image';
          if (type === 'file') return 'file';
          if (type === 'json') return 'sheet';
          if (type === 'code' || type === 'html') return 'code';
          return 'text';
        };

        const emitToolArtifactUpdate = async (toolCallId: string) => {
          const state = toolArtifactStates.get(toolCallId);
          if (!state) return;

          const { value } = await parsePartialJson(state.rawInput);
          const input = (value ?? {}) as Partial<CreateArtifactInput>;
          const artifactType = input.type;
          if (!artifactType) return;
          const title = input.title?.trim() || 'Untitled';
          const kind = getArtifactKind(artifactType);

          if (!state.started) {
            writer.write({ type: 'data-id', data: state.artifactId });
            writer.write({
              type: 'data-title',
              data: { id: state.artifactId, title }
            });
            writer.write({
              type: 'data-kind',
              data: {
                id: state.artifactId,
                kind,
                artifactType
              }
            });
            writer.write({
              type: 'data-clear',
              data: { id: state.artifactId }
            });
            state.started = true;
            state.lastTitle = title;
            state.lastKind = kind;
            state.lastType = artifactType;
          } else {
            if (title !== state.lastTitle) {
              writer.write({
                type: 'data-title',
                data: { id: state.artifactId, title }
              });
              state.lastTitle = title;
            }
            if (kind !== state.lastKind || artifactType !== state.lastType) {
              writer.write({
                type: 'data-kind',
                data: {
                  id: state.artifactId,
                  kind,
                  artifactType
                }
              });
              state.lastKind = kind;
              state.lastType = artifactType;
            }
          }

          if (kind === 'code' || kind === 'sheet' || kind === 'text') {
            const nextContent = input.content ?? '';
            if (nextContent !== state.lastContent) {
              const isAppend = nextContent.startsWith(state.lastContent);
              const delta = isAppend
                ? nextContent.slice(state.lastContent.length)
                : nextContent;

              writer.write({
                type:
                  kind === 'code' || kind === 'sheet'
                    ? 'data-codeDelta'
                    : 'data-textDelta',
                data: {
                  id: state.artifactId,
                  title,
                  delta,
                  mode: isAppend ? 'append' : 'replace',
                  status: 'streaming',
                  artifactType,
                  ...(kind === 'code' || kind === 'sheet'
                    ? {
                        language:
                          artifactType === 'json'
                            ? 'json'
                            : (input.language ?? undefined)
                      }
                    : {})
                }
              });
              state.lastContent = nextContent;
            }
            return;
          }

          if (
            kind === 'image' &&
            input.fileUrl &&
            input.fileUrl !== state.lastUrl
          ) {
            writer.write({
              type: 'data-imageDelta',
              data: {
                id: state.artifactId,
                title,
                url: input.fileUrl,
                status: 'streaming',
                artifactType
              }
            });
            state.lastUrl = input.fileUrl;
            return;
          }

          if (kind === 'file') {
            const nextUrl = input.fileUrl ?? null;
            const nextFileName = input.fileName ?? null;
            const nextMimeType = input.mimeType ?? null;
            const nextSize = input.size ?? null;

            if (
              nextUrl &&
              (nextUrl !== state.lastUrl ||
                nextFileName !== state.lastFileName ||
                nextMimeType !== state.lastMimeType ||
                nextSize !== state.lastSize)
            ) {
              writer.write({
                type: 'data-fileDelta',
                data: {
                  id: state.artifactId,
                  title,
                  url: nextUrl,
                  fileName: nextFileName,
                  mimeType: nextMimeType,
                  size: nextSize,
                  status: 'streaming',
                  artifactType
                }
              });
              state.lastUrl = nextUrl;
              state.lastFileName = nextFileName;
              state.lastMimeType = nextMimeType;
              state.lastSize = nextSize;
            }
          }
        };

        const artifactTools = {
          create_artifact: tool({
            description:
              'Create a new artifact (code, markdown, html, json, text, image, or file).',
            inputSchema: createArtifactSchema,
            onInputStart: ({ toolCallId }) => {
              toolArtifactStates.set(toolCallId, {
                artifactId: generateUUID(),
                rawInput: '',
                started: false,
                lastTitle: 'Untitled',
                lastKind: 'text',
                lastType: undefined,
                lastContent: '',
                lastUrl: null,
                lastFileName: null,
                lastMimeType: null,
                lastSize: null
              });
            },
            onInputDelta: async ({ toolCallId, inputTextDelta }) => {
              const state = toolArtifactStates.get(toolCallId);
              if (!state) return;
              state.rawInput += inputTextDelta;
              await emitToolArtifactUpdate(toolCallId);
            },
            execute: async (input, options?: { toolCallId?: string }) => {
              assertArtifactPayload(input);
              const streamState = options?.toolCallId
                ? toolArtifactStates.get(options.toolCallId)
                : undefined;
              const artifactId =
                streamState?.artifactId ?? input.id ?? generateUUID();
              const artifact = createArtifactRecord(input, artifactId);
              if (!completedArtifacts.has(artifact.id)) {
                completedArtifactOrder.push(artifact.id);
              }
              completedArtifacts.set(artifact.id, artifact);
              if (!streamState?.started) {
                emitArtifactDelta(artifact);
              } else {
                writer.write({
                  type: 'data-finish',
                  data: { id: artifact.id }
                });
              }
              writer.write({
                type: 'data-artifact',
                data: { artifact }
              });
              if (options?.toolCallId) {
                toolArtifactStates.delete(options.toolCallId);
              }

              return { id: artifact.id };
            }
          })
        };

        writer.write({ type: 'data-chat', data: { title } });
        writer.write({ type: 'data-messageId', data: assistantMessageId });

        const res = streamText({
          model: getLanguageModel(provider, modelId),
          system: systemMessage
            ? `${systemMessage}\n\n${artifactSystemPrompt}`
            : artifactSystemPrompt,
          messages: await convertToModelMessages(chatMessages),
          tools: artifactTools,
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
              const now = new Date();
              reasonStartedAt ??= now;
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
            originalMessages: chatMessages,
            generateMessageId: () => assistantMessageId,
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

              if (
                part.type === 'reasoning-start' ||
                part.type === 'reasoning-delta' ||
                part.type === 'reasoning-end'
              ) {
                const now = new Date();
                let nextReasonDuration = reasonDuration;

                if (part.type === 'reasoning-start') {
                  reasonStartedAt ??= now;
                } else if (part.type === 'reasoning-delta') {
                  reasonStartedAt ??= now;
                } else if (part.type === 'reasoning-end') {
                  if (reasonStartedAt) {
                    nextReasonDuration += Math.max(
                      0,
                      now.getTime() - reasonStartedAt.getTime()
                    );
                  }
                  reasonDuration = nextReasonDuration;
                  reasonStartedAt = null;
                }

                if (reasonStartedAt) {
                  nextReasonDuration += Math.max(
                    0,
                    now.getTime() - reasonStartedAt.getTime()
                  );
                }

                return {
                  reasonDuration: nextReasonDuration || undefined
                } satisfies Partial<MessageMetadata>;
              }
            }
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ responseMessage }) => {
        const finishedAt = new Date();
        if (reasonStartedAt) {
          reasonDuration += Math.max(
            0,
            finishedAt.getTime() - reasonStartedAt.getTime()
          );
          reasonStartedAt = null;
        }

        if (responseMessage) {
          responseMessage.metadata = {
            ...responseMessage.metadata,
            reasonDuration:
              responseMessage.metadata?.reasonDuration ??
              (reasonDuration || undefined),
            createdAt: responseMessage.metadata?.createdAt ?? finishedAt,
            updatedAt: finishedAt
          };
          responseMessage.id = responseMessage.id || assistantMessageId;
        }

        if (!responseMessage) {
          return;
        }

        const persistedArtifacts = completedArtifactOrder
          .map(artifactId => completedArtifacts.get(artifactId))
          .filter((artifact): artifact is Artifact => Boolean(artifact));

        await db.transaction(async tx => {
          await tx.insert(messagesTable).values({
            id: responseMessage.id,
            parentId: responseMessage.metadata?.parentId ?? userMessage.id,
            role: responseMessage.role,
            parts: responseMessage.parts,
            chatId: id,
            userId: session.user.id,
            reasonDuration: responseMessage.metadata?.reasonDuration,
            createdAt: responseMessage.metadata?.createdAt ?? finishedAt,
            updatedAt: responseMessage.metadata?.updatedAt ?? finishedAt
          });

          if (persistedArtifacts.length === 0) {
            return;
          }

          await tx.insert(artifactsTable).values(
            persistedArtifacts.map(artifact => ({
              id: artifact.id,
              chatId: id,
              messageId: responseMessage.id,
              userId: session.user.id,
              title: artifact.title,
              type: artifact.type,
              language: artifact.language ?? null,
              content: artifact.content ?? null,
              fileUrl: artifact.fileUrl ?? null,
              fileName: artifact.fileName ?? null,
              mimeType: artifact.mimeType ?? null,
              size: artifact.size ?? null,
              createdAt: artifact.createdAt,
              updatedAt: artifact.updatedAt
            }))
          );
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
