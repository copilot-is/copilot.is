import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Message } from '@/lib/types';
import { api } from '@/trpc/server';
import { Chat } from '@/components/chat';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface ChatPageProps {
  params: {
    chatId: string;
  };
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const chatId = params.chatId;
  const chat = await api.chat.detail.query({ chatId });

  return {
    title: chat?.title
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const chatId = params.chatId;
  const chat = await api.chat.detail.query({ chatId });

  if (!chat) {
    notFound();
  }

  return (
    <Chat
      id={chatId}
      chat={{ ...chat, messages: chat.messages as Message[] }}
    />
  );
}
