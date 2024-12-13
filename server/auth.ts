import { cache } from 'react';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth, {
  type DefaultSession,
  type Session,
  type User
} from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

import { env } from '@/lib/env';

import { db } from './db';
import { accounts, sessions, users, verificationTokens } from './db/schema';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export const {
  handlers,
  auth: uncachedAuth,
  signIn,
  signOut
} = NextAuth({
  debug: env.NODE_ENV !== 'production',
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET
    }),
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET
    })
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens
  }),
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.id = profile.id;
        token.image = profile.avatar_url || profile.picture;
      }
      return token;
    },
    session({ session, user }: { session: Session; user?: User }) {
      if (session?.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    }
  },
  pages: {
    signIn: '/login'
  }
});

const auth = cache(uncachedAuth);

export { auth };
