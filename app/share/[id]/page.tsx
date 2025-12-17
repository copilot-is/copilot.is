import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';

import { convertToChatMessages, findModelByValue } from '@/lib/utils';
import { api } from '@/trpc/server';
import { Messages } from '@/components/messages';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;
  const chat = await api.share.detail({ id });

  return {
    title: chat?.title
  };
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const id = params.id;
  const chat = await api.share.detail({ id });

  if (!chat) {
    notFound();
  }

  const provider = findModelByValue(chat.type, chat.model)?.provider;
  const chatMessages = convertToChatMessages(chat.messages);

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
      <Messages
        className="pb-5"
        model={chat.model}
        messages={chatMessages}
        provider={provider}
        isReadonly={true}
      />
    </div>
  );
}
