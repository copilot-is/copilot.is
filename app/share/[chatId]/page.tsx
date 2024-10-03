import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Message } from '@/lib/types';
import { formatDate, providerFromModel } from '@/lib/utils';
import { api } from '@/trpc/server';
import { ChatList } from '@/components/chat-list';

interface SharePageProps {
  params: {
    chatId: string;
  };
}

export async function generateMetadata({
  params
}: SharePageProps): Promise<Metadata> {
  const chatId = params.chatId;
  const chat = await api.chat.getShared.query({ chatId });

  return {
    title: chat?.title
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const chatId = params.chatId;
  const chat = await api.chat.getShared.query({ chatId });

  if (!chat) {
    notFound();
  }

  const messages = chat.messages as Message[];
  const provider = providerFromModel(chat.usage.model);

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-4xl px-4">
        <div className="space-y-1 border-b py-6">
          <h1 className="text-2xl font-bold">{chat.title}</h1>
          <div className="text-sm text-muted-foreground">
            {formatDate(chat.createdAt)} · {messages.length} messages
          </div>
        </div>
      </div>
      <ChatList
        id={chat.id}
        messages={messages}
        provider={provider}
        className="pb-5"
        readonly
      />
    </div>
  );
}
