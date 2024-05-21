import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { formatDate, providerFromModel } from '@/lib/utils';
import { ChatList } from '@/components/chat-list';
import { getSharedChat } from '@/app/actions';

interface SharePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params
}: SharePageProps): Promise<Metadata> {
  const id = params.id;
  const chat = await getSharedChat(id);

  return {
    title: chat?.title
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const id = params.id;
  const chat = await getSharedChat(id);

  if (!chat) {
    notFound();
  }

  const provider = providerFromModel(chat.usage.model);

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-4xl px-4">
        <div className="space-y-1 border-b bg-background py-6">
          <h1 className="text-2xl font-bold">{chat.title}</h1>
          <div className="text-sm text-muted-foreground">
            {formatDate(chat.createdAt)} · {chat.messages.length} messages
          </div>
        </div>
      </div>
      <ChatList
        id={chat.id}
        messages={chat.messages}
        provider={provider}
        className="pb-5"
      />
    </div>
  );
}
