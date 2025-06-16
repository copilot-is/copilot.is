import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';

import { findModelByValue } from '@/lib/utils';
import { api } from '@/trpc/server';
import { ChatList } from '@/components/chat-list';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;
  const chat = await api.share.detail.query({ id });

  return {
    title: chat?.title
  };
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const id = params.id;
  const chat = await api.share.detail.query({ id });

  if (!chat) {
    notFound();
  }

  const provider = findModelByValue(chat.model)?.provider;

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-4xl px-4">
        <div className="space-y-1 border-b py-6">
          <h1 className="text-2xl font-bold">{chat.title}</h1>
          <div className="text-sm text-muted-foreground">
            {format(chat.createdAt, 'MMMM d, yyyy')} · {chat.messages.length}
            <span className="pl-0.5">messages</span>
          </div>
        </div>
      </div>
      <ChatList
        className="pb-5"
        model={chat.model}
        messages={chat.messages}
        provider={provider}
        isReadonly={true}
      />
    </div>
  );
}
