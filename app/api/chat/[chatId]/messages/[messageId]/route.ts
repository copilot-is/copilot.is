import { NextResponse, type NextRequest } from 'next/server';

import { Message } from '@/lib/types';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

type PutData = {
  message: Message;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const chatId = params.chatId;
  const messageId = params.messageId;
  const json: PutData = await req.json();
  const { message } = json;

  if (!message) {
    return NextResponse.json(
      { error: 'Invalid message parameters' },
      { status: 400 }
    );
  }

  try {
    const data = await api.chat.updateMessage.mutate({
      chatId,
      messageId,
      message
    });

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
  { params }: { params: { chatId: string; messageId: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chatId = params.chatId;
    const messageId = params.messageId;
    await api.chat.deleteMessage.mutate({ chatId, messageId });

    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
