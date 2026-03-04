import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  PgColumn,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from 'drizzle-orm/pg-core';
import { type AdapterAccount } from 'next-auth/adapters';

import { ChatMessage, ChatType } from '@/types';

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(name => name);

export const chats = createTable(
  'chat',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    type: varchar('type', { length: 32 })
      .notNull()
      .default('chat')
      .$type<ChatType>(),
    modelId: varchar('model_id', { length: 255 }).notNull(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  chat => [
    index('chat_userId_idx').on(chat.userId),
    index('chat_type_idx').on(chat.type),
    index('chat_createdAt_idx').on(chat.createdAt),
    index('chat_userId_createdAt_idx').on(chat.userId, chat.createdAt),
    index('chat_userId_type_createdAt_idx').on(
      chat.userId,
      chat.type,
      chat.createdAt
    )
  ]
);

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  model: one(models, { fields: [chats.modelId], references: [models.modelId] }),
  messages: many(messages)
}));

export const messages = createTable(
  'message',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    parentId: varchar('parent_id', { length: 255 }).references(
      (): PgColumn => messages.id,
      { onDelete: 'cascade' }
    ),
    role: varchar('role', { length: 32 })
      .notNull()
      .$type<'system' | 'user' | 'assistant'>(),
    parts: jsonb('parts').notNull().$type<ChatMessage['parts']>(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chatId: varchar('chat_id', { length: 255 })
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  message => [
    index('message_parentId_idx').on(message.parentId),
    index('message_userId_idx').on(message.userId),
    index('message_chatId_idx').on(message.chatId),
    index('message_createdAt_idx').on(message.createdAt)
  ]
);

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.id] }),
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
  parent: one(messages, {
    fields: [messages.parentId],
    references: [messages.id]
  })
}));

export const shares = createTable(
  'share',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    chatId: varchar('chat_id', { length: 255 })
      .notNull()
      .unique()
      .references(() => chats.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  share => [
    index('share_chatId_idx').on(share.chatId),
    index('share_userId_idx').on(share.userId)
  ]
);

export const sharesRelations = relations(shares, ({ one }) => ({
  user: one(users, { fields: [shares.userId], references: [users.id] }),
  chat: one(chats, { fields: [shares.chatId], references: [chats.id] })
}));

export const users = createTable('user', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: timestamp('email_verified', {
    mode: 'date',
    withTimezone: true
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar('image', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('user')
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts)
}));

export const accounts = createTable(
  'account',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 })
      .$type<AdapterAccount['type']>()
      .notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', {
      length: 255
    }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 })
  },
  account => [
    primaryKey({
      columns: [account.provider, account.providerAccountId]
    }),
    index('account_user_id_idx').on(account.userId)
  ]
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] })
}));

export const sessions = createTable(
  'session',
  {
    sessionToken: varchar('session_token', { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', {
      mode: 'date',
      withTimezone: true
    }).notNull()
  },
  session => [index('session_user_id_idx').on(session.userId)]
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const verificationTokens = createTable(
  'verification_token',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', {
      mode: 'date',
      withTimezone: true
    }).notNull()
  },
  vt => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const emailVerificationCodes = createTable(
  'email_verification_code',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    expires: timestamp('expires', {
      mode: 'date',
      withTimezone: true
    }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  evc => [
    index('evc_email_idx').on(evc.email),
    index('evc_expires_idx').on(evc.expires)
  ]
);

// ============================================================================
// Admin Console Tables
// ============================================================================

/**
 * AI Provider - Stores API provider configurations
 * Supported types: openai, azure, google, vertex, anthropic, xai, deepseek
 */
export const providers = createTable(
  'provider',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    apiKey: text('api_key').notNull(),
    baseUrl: varchar('base_url', { length: 500 }),
    isEnabled: boolean('is_enabled').notNull().default(false),
    apiOptions: jsonb('api_options').$type<Record<string, unknown>>(),
    image: text('image'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  provider => [
    index('provider_type_idx').on(provider.type),
    index('provider_is_enabled_idx').on(provider.isEnabled)
  ]
);

export const providersRelations = relations(providers, ({ many }) => ({
  models: many(models)
}));

/**
 * Prompt - System prompts and user templates
 * Types: system (for AI models), user (for user templates)
 * Capability: chat, image, video, audio (optional, for filtering)
 * Providers: array of provider types (e.g., openai, xai, google)
 */
export const prompts = createTable(
  'prompt',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 20 }).notNull().$type<'system' | 'user'>(),
    capability: varchar('capability', { length: 32 }).$type<
      'chat' | 'image' | 'video' | 'audio' | null
    >(),
    providers: jsonb('providers').$type<string[]>(),
    image: text('image'),
    content: text('content').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  prompt => [
    index('prompt_type_idx').on(prompt.type),
    index('prompt_capability_idx').on(prompt.capability)
  ]
);

/**
 * Model - AI model configurations
 * Capabilities: chat, image, video, audio
 */
export const models = createTable(
  'model',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    modelId: varchar('model_id', { length: 255 }).notNull(),
    providerId: varchar('provider_id', { length: 255 })
      .notNull()
      .references(() => providers.id, { onDelete: 'restrict' }),
    capability: varchar('capability', { length: 32 })
      .notNull()
      .$type<'chat' | 'image' | 'video' | 'audio'>(),
    image: text('image'),
    aliases: jsonb('aliases').$type<string[]>(),
    supportsVision: boolean('supports_vision').default(false),
    supportsReasoning: boolean('supports_reasoning').default(false),
    isEnabled: boolean('is_enabled').notNull().default(true),
    uiOptions: jsonb('ui_options').$type<{
      sizes?: string[];
      aspectRatios?: string[];
      resolutions?: string[];
      voices?: string[];
      reasoning?: boolean;
    }>(),
    apiParams: jsonb('api_params').$type<{
      temperature?: number;
      topP?: number;
      topK?: number;
      maxOutputTokens?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
    }>(),
    systemPromptId: varchar('system_prompt_id', { length: 255 }).references(
      () => prompts.id,
      { onDelete: 'set null' }
    ),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  model => [
    index('model_provider_id_idx').on(model.providerId),
    index('model_capability_idx').on(model.capability),
    index('model_is_enabled_idx').on(model.isEnabled),
    uniqueIndex('model_provider_model_unique').on(
      model.providerId,
      model.modelId
    )
  ]
);

export const modelsRelations = relations(models, ({ one }) => ({
  provider: one(providers, {
    fields: [models.providerId],
    references: [providers.id]
  }),
  systemPrompt: one(prompts, {
    fields: [models.systemPromptId],
    references: [prompts.id]
  })
}));

/**
 * Setting - Application settings (key-value store)
 */
export const settings = createTable('setting', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  description: varchar('description', { length: 500 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
