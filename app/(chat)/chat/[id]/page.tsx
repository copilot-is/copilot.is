import { Metadata } from 'next';

import { api } from '@/trpc/server';
import { ChatNotFound } from '@/components/chat-notfound';
import { ChatUI } from '@/components/chat-ui';

export const maxDuration = 60;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;
  const chat = await api.chat.detail.query({ id });

  return {
    title: chat?.title
  };
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const id = params.id;

  const chat = await api.chat.detail.query({ id });
  if (!chat) {
    return <ChatNotFound />;
  }

  return <ChatUI id={chat.id} initialChat={chat} />;
}
