import { Metadata } from 'next';

import { convertToChatMessages } from '@/lib/utils';
import { api } from '@/trpc/server';
import { ChatNotFound } from '@/components/chat-notfound';
import { ImageUI } from '@/components/image-ui';

export const maxDuration = 60;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;
  const chat = await api.chat.detail({ id, type: 'image' });

  return {
    title: chat?.title || 'Image Generation'
  };
}

export default async function ImageDetailPage(props: PageProps) {
  const params = await props.params;
  const id = params.id;

  const chat = await api.chat.detail({ id, type: 'image' });
  if (!chat) {
    return <ChatNotFound />;
  }

  const chatMessages = convertToChatMessages(chat.messages);

  return (
    <ImageUI
      key={chat.id}
      id={chat.id}
      initialChat={{
        title: chat.title,
        model: chat.model
      }}
      initialMessages={chatMessages}
    />
  );
}
