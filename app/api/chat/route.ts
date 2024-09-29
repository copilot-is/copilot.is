import { NextResponse, type NextRequest } from 'next/server';

import { Message, type Usage } from '@/lib/types';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await api.chat.list.query();

    if (!data) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

type PostData = {
  chatId?: string;
  regenerateId?: string;
  title?: string;
  messages: Message[];
  usage: Usage;
};

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const chatId = json.chatId || '';
  const title = json.title || 'Untitled';
  const { regenerateId, messages, usage } = json;

  if (!usage) {
    return NextResponse.json(
      { error: 'Invalid usage parameters' },
      { status: 400 }
    );
  }

  try {
    const data = await api.chat.create.mutate({
      chatId,
      regenerateId,
      title,
      usage,
      messages
    });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await api.chat.deleteAll.mutate();
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
