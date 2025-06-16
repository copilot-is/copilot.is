import { NextResponse, type NextRequest } from 'next/server';

import { Chat } from '@/types';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = await props.params;
    const id = params.id;
    const searchParams = req.nextUrl.searchParams;
    const includeMessages = searchParams.get('includeMessages');
    const data = await api.chat.detail.query({
      id,
      includeMessages: includeMessages === 'false' ? false : undefined
    });

    if (!data) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}

type PutData = Partial<Pick<Chat, 'id' | 'title' | 'model'>>;

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = params.id;
  const chat: PutData = await req.json();

  if (!chat) {
    return NextResponse.json(
      { error: 'Invalid chat parameters' },
      { status: 400 }
    );
  }

  try {
    await api.chat.update.mutate({ id, ...chat });
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = params.id;
    await api.chat.delete.mutate({ id });
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}
