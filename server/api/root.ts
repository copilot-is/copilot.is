import { chatRouter } from '@/server/api/routers/chat';
import { messageRouter } from '@/server/api/routers/message';
import { shareRouter } from '@/server/api/routers/share';
import { createTRPCRouter } from '@/server/api/trpc';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chat: chatRouter,
  message: messageRouter,
  share: shareRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
