import { NextResponse, type NextRequest } from 'next/server';

import { type Chat } from '@/lib/types';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chatId = params.chatId;
    const data = await api.chat.detail.query({ chatId });

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

type PutData = Pick<Chat, 'title' | 'shared' | 'usage'>;

export async function PUT(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const chatId = params.chatId;
  const chat: PutData = await req.json();

  if (!chat) {
    return NextResponse.json(
      { error: 'Invalid chat parameters' },
      { status: 400 }
    );
  }

  try {
    const data = await api.chat.update.mutate({ chatId, chat });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chatId = params.chatId;
    await api.chat.delete.mutate({ chatId });
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
