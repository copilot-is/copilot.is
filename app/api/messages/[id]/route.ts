import { NextResponse, type NextRequest } from 'next/server';
import { UIMessage } from '@ai-sdk/ui-utils';

import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

type PutData = {
  message: UIMessage;
};

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
  const json: PutData = await req.json();
  const { message } = json;

  if (!message) {
    return NextResponse.json(
      { error: 'Invalid message parameters' },
      { status: 400 }
    );
  }

  try {
    const data = await api.message.update.mutate({
      id,
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
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = params.id;
    await api.message.delete.mutate({ id });

    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
