import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { type AdapterAccount } from 'next-auth/adapters';

import { type Usage } from '@/lib/types';

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
    usage: jsonb('usage').notNull().$type<Usage>(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    shared: boolean('shared').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  chat => [
    index('chat_userId_idx').on(chat.userId),
    index('chat_createdAt_idx').on(chat.createdAt)
  ]
);

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  messages: many(messages)
}));

export const messages = createTable(
  'message',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    role: varchar('role', { length: 32 }).notNull(),
    content: jsonb('content').notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    chatId: varchar('chat_id', { length: 255 })
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  message => [
    index('message_userId_idx').on(message.userId),
    index('message_chatId_idx').on(message.chatId),
    index('message_createdAt_idx').on(message.createdAt)
  ]
);

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.id] }),
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] })
}));

export const users = createTable('user', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: timestamp('email_verified', {
    mode: 'date',
    withTimezone: true
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar('image', { length: 255 })
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
