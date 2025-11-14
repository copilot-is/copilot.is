import { Metadata } from 'next';

import { convertToChatMessages } from '@/lib/utils';
import { api } from '@/trpc/server';
import { ChatNotFound } from '@/components/chat-notfound';
import { VoiceUI } from '@/components/voice-ui';

export const maxDuration = 60;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;
  const chat = await api.chat.detail.query({ id, type: 'voice' });

  return {
    title: chat?.title || 'Voice Generation'
  };
}

export default async function VoiceDetailPage(props: PageProps) {
  const params = await props.params;
  const id = params.id;

  const chat = await api.chat.detail.query({ id, type: 'voice' });
  if (!chat) {
    return <ChatNotFound />;
  }

  const chatMessages = convertToChatMessages(chat.messages);

  return (
    <VoiceUI
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
