import { NextResponse, type NextRequest } from 'next/server';

import { type Chat } from '@/lib/types';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ chatId: string }> }
) {
  const params = await props.params;
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

type PutData = Partial<
  Pick<Chat, 'id' | 'title' | 'shared' | 'usage' | 'messages'>
> & {
  regenerateId?: string;
};

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ chatId: string }> }
) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = params.chatId;
  const chat: PutData = await req.json();

  if (!chat) {
    return NextResponse.json(
      { error: 'Invalid chat parameters' },
      { status: 400 }
    );
  }

  try {
    const data = await api.chat.update.mutate({ id, ...chat });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ chatId: string }> }
) {
  const params = await props.params;
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
