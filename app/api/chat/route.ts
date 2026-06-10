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
import {
  artifactKindFromType,
  assertArtifactPayload,
  type ArtifactKind
} from '@/lib/artifact';
import { normalizeChatUsage } from '@/lib/chat-usage';
import { ArtifactSystemPrompt } from '@/lib/constant';
import { preflightGate } from '@/lib/preflight';
import {
  AllProvidersFailedError,
  bindingsToFailoverProviders,
  getLanguageModel,
  type FailoverProvider
} from '@/lib/provider';
import {
  findModelByModelId,
  getSystemPrompt,
  getTitleSettings
} from '@/lib/queries';
import { recordChatUsage } from '@/lib/usage';
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
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Fetch model from database to validate
  const dbModel = await findModelByModelId(modelId, 'chat');
  const candidates = bindingsToFailoverProviders(dbModel?.providers ?? []);
  if (!dbModel || candidates.length === 0) {
    console.error(`[chat] model unavailable: ${modelId}`);
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
    capability: 'chat'
  });
  if (gate) return gate;

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

    // Build system prompt (only if configured)
    const systemPromptContent = await getSystemPrompt(dbModel.systemPromptId);
    const systemMessage = systemPromptContent
      ? formatString(systemPromptContent, {
          provider: dbModel.provider?.name || '',
          modelId,
          date: new Date().toISOString()
        })
      : undefined;
    let reasonStartedAt: Date | null = null;
    let reasonDuration = 0;
    const assistantMessageId = generateUUID();
    const completedArtifacts = new Map<string, Artifact>();
    const completedArtifactOrder: string[] = [];

    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        // Artifact stream parts are forwarded to the client for the live
        // canvas/preview animation (via onData → handleStreamPart) but marked
        // transient so they are NOT accumulated into message.parts — thousands
        // of delta parts per artifact would bloat the saved message and jank
        // streaming as content grows. The artifact itself is persisted to the
        // artifacts table, so nothing is lost.
        const emitArtifactStreamPart = (
          part: Parameters<typeof writer.write>[0]
        ) =>
          writer.write({
            ...part,
            transient: true
          } as Parameters<typeof writer.write>[0]);

        const emitArtifactDelta = (artifact: Artifact) => {
          emitArtifactStreamPart({ type: 'data-id', data: artifact.id });
          const kind = artifactKindFromType(artifact.type);
          emitArtifactStreamPart({
            type: 'data-title',
            data: { id: artifact.id, title: artifact.title }
          });
          emitArtifactStreamPart({
            type: 'data-kind',
            data: {
              id: artifact.id,
              kind,
              artifactType: artifact.type
            }
          });
          emitArtifactStreamPart({
            type: 'data-clear',
            data: { id: artifact.id }
          });
          if (['code', 'json', 'html'].includes(artifact.type)) {
            emitArtifactStreamPart({
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
            emitArtifactStreamPart({
              type: 'data-finish',
              data: { id: artifact.id }
            });
            return;
          }
          if (artifact.type === 'image' && artifact.fileUrl) {
            emitArtifactStreamPart({
              type: 'data-imageDelta',
              data: {
                id: artifact.id,
                title: artifact.title,
                url: artifact.fileUrl,
                status: 'done',
                artifactType: artifact.type
              }
            });
            emitArtifactStreamPart({
              type: 'data-finish',
              data: { id: artifact.id }
            });
            return;
          }
          if (artifact.type === 'file' && artifact.fileUrl) {
            emitArtifactStreamPart({
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
            emitArtifactStreamPart({
              type: 'data-finish',
              data: { id: artifact.id }
            });
            return;
          }
          emitArtifactStreamPart({
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
          emitArtifactStreamPart({
            type: 'data-finish',
            data: { id: artifact.id }
          });
        };

        const createArtifactSchema = z.object({
          id: z.string().min(1).optional(),
          title: z.string().min(1),
          type: artifactTypeSchema,
          language: z.string().optional(),
          content: z.string().optional(),
          fileUrl: z.url().optional(),
          fileName: z.string().optional(),
          mimeType: z.string().optional(),
          size: z.number().int().nonnegative().optional()
        });
        type CreateArtifactInput = z.infer<typeof createArtifactSchema>;

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
          lastKind: ArtifactKind;
          lastType?: CreateArtifactInput['type'];
          lastContent: string;
          lastUrl: string | null;
          lastFileName: string | null;
          lastMimeType: string | null;
          lastSize: number | null;
        };

        const toolArtifactStates = new Map<string, ToolArtifactStreamState>();

        const emitToolArtifactUpdate = async (toolCallId: string) => {
          const state = toolArtifactStates.get(toolCallId);
          if (!state) return;

          const { value } = await parsePartialJson(state.rawInput);
          const input = (value ?? {}) as Partial<CreateArtifactInput>;
          const artifactType = input.type;
          if (!artifactType) return;
          const title = input.title?.trim() || 'Untitled';
          const kind = artifactKindFromType(artifactType);

          if (!state.started) {
            emitArtifactStreamPart({ type: 'data-id', data: state.artifactId });
            emitArtifactStreamPart({
              type: 'data-title',
              data: { id: state.artifactId, title }
            });
            emitArtifactStreamPart({
              type: 'data-kind',
              data: {
                id: state.artifactId,
                kind,
                artifactType
              }
            });
            emitArtifactStreamPart({
              type: 'data-clear',
              data: { id: state.artifactId }
            });
            state.started = true;
            state.lastTitle = title;
            state.lastKind = kind;
            state.lastType = artifactType;
          } else {
            if (title !== state.lastTitle) {
              emitArtifactStreamPart({
                type: 'data-title',
                data: { id: state.artifactId, title }
              });
              state.lastTitle = title;
            }
            if (kind !== state.lastKind || artifactType !== state.lastType) {
              emitArtifactStreamPart({
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

              emitArtifactStreamPart({
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
            emitArtifactStreamPart({
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
              emitArtifactStreamPart({
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
                emitArtifactStreamPart({
                  type: 'data-finish',
                  data: { id: artifact.id }
                });
              }
              emitArtifactStreamPart({
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

        const modelMessages = await convertToModelMessages(chatMessages);

        const buildStream = (failoverProvider: FailoverProvider) =>
          streamText({
            model: getLanguageModel(failoverProvider, modelId),
            system: systemMessage
              ? `${systemMessage}\n\n${ArtifactSystemPrompt}`
              : ArtifactSystemPrompt,
            messages: modelMessages,
            tools: artifactTools,
            ...(failoverProvider.apiOptions && {
              providerOptions: {
                [failoverProvider.type]: failoverProvider.apiOptions
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
              if (!usage) {
                // Provider didn't report usage — request runs free. Should not
                // happen with major providers; surface so it's visible in logs.
                console.warn(
                  `[chat] no usage reported for model=${modelId}; skipping recordChatUsage`
                );
                return;
              }
              await recordChatUsage({
                userId: session.user.id,
                chatId: id,
                messageId: assistantMessageId,
                modelId,
                providerId: failoverProvider.id,
                usage: normalizeChatUsage(usage)
              });
            }
          });

        // Streaming failover is limited by design: once tokens reach the client
        // a provider can't be swapped without duplicating output, and AI SDK v6
        // exposes no "connection established" signal before the stream is
        // consumed (awaiting `res.response` would consume the whole stream and
        // block until generation finishes, breaking streaming). So here we only
        // fail over on errors thrown while *building* the stream (e.g. an invalid
        // provider credential). Runtime/mid-stream errors surface to the client
        // via the UI message stream. Non-streaming routes do full failover.
        let res: ReturnType<typeof buildStream> | undefined;
        const failoverAttempts: { provider: string; error: unknown }[] = [];
        for (let i = 0; i < candidates.length; i++) {
          const candidate = candidates[i];
          const isLast = i === candidates.length - 1;
          try {
            res = buildStream(candidate);
            break;
          } catch (error) {
            // Any build-time error (bad/undecryptable credential, invalid
            // provider config) means this provider can't start — try the next
            // one regardless; rethrow only after the last candidate.
            failoverAttempts.push({ provider: candidate.name, error });
            if (isLast) {
              throw error;
            }
          }
        }
        if (!res) {
          throw new AllProvidersFailedError(
            'All providers failed',
            failoverAttempts
          );
        }

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

          // Each artifact created this turn is its own independent row, pinned
          // to this turn's message.
          if (persistedArtifacts.length > 0) {
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
          }
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
    console.error('Chat error:', err);
    return NextResponse.json(
      { error: 'Oops, an error occurred!' },
      { status: 500 }
    );
  }
}
