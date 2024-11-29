import { Metadata } from 'next';

import { type Chat } from '@/lib/types';
import { api } from '@/trpc/server';
import { ChatNotFound } from '@/components/chat-notfound';
import { ChatUI } from '@/components/chat-ui';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface PageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const chatId = params.chatId;
  const chat = await api.chat.detail.query({ chatId });

  return {
    title: chat?.title
  };
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const chatId = params.chatId;

  const chat = await api.chat.detail.query({ chatId });
  if (!chat) {
    return <ChatNotFound />;
  }

  return <ChatUI chat={chat as Chat} />;
}
