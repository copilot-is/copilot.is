import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { type Account } from 'next-auth';

import { appConfig } from '@/lib/appconfig';
import { type Usage } from '@/lib/types';

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(name => appConfig.db.prefix + name);

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
  chat => ({
    userIdIdx: index('chat_userId_idx').on(chat.userId),
    createdAtIdx: index('chat_createdAt_idx').on(chat.createdAt)
  })
);

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  messages: many(messages)
}));

export const role = pgEnum('role', ['system', 'user', 'assistant', 'tool']);

export const messages = createTable(
  'message',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    role: role('role').notNull(),
    content: jsonb('content').notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    chatId: varchar('chat_id', { length: 255 })
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  message => ({
    userIdIdx: index('message_userId_idx').on(message.userId),
    chatIdIdx: index('message_chatId_idx').on(message.chatId),
    createdAtIdx: index('message_createdAt_idx').on(message.createdAt)
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.id] }),
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] })
}));

export const users = createTable('user', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: timestamp('emailVerified', {
    mode: 'date'
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar('image', { length: 255 })
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts)
}));

export const accounts = createTable(
  'account',
  {
    userId: varchar('userId', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).$type<Account['type']>().notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 })
  },
  account => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId]
    }),
    userIdIdx: index('account_userId_idx').on(account.userId)
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] })
}));

export const sessions = createTable(
  'session',
  {
    sessionToken: varchar('sessionToken', { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar('userId', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date' }).notNull()
  },
  session => ({
    userIdIdx: index('session_userId_idx').on(session.userId)
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const verificationTokens = createTable(
  'verificationToken',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull()
  },
  vt => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] })
  })
);
