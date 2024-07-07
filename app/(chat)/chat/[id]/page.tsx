import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Chat } from '@/components/chat';
import { getChat } from '@/app/actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface ChatPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const id = params.id;
  const chat = await getChat(id);

  return {
    title: chat?.title
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const id = params.id;
  const chat = await getChat(id);

  if (!chat) {
    notFound();
  }

  return <Chat id={chat.id} chat={chat} />;
}
