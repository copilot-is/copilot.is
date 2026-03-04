import { Metadata } from 'next';

import { convertToChatMessages } from '@/lib/utils';
import { api } from '@/trpc/server';
import { AudioUI } from '@/components/audio-ui';
import { ChatNotFound } from '@/components/chat-notfound';

export const maxDuration = 60;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;
  const chat = await api.chat.detail({ id, type: 'audio' });

  return {
    title: chat?.title || 'Audio Generation'
  };
}

export default async function AudioDetailPage(props: PageProps) {
  const params = await props.params;
  const id = params.id;

  const chat = await api.chat.detail({ id, type: 'audio' });
  if (!chat) {
    return <ChatNotFound />;
  }

  const chatMessages = convertToChatMessages(chat.messages);

  return (
    <AudioUI
      key={chat.id}
      id={chat.id}
      initialChat={{
        title: chat.title,
        modelId: chat.modelId ?? undefined
      }}
      initialMessages={chatMessages}
    />
  );
}
