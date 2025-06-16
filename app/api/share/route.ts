import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

type PostData = {
  chatId: string;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json: PostData = await req.json();
  const { chatId } = json;

  if (!chatId) {
    return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
  }

  try {
    const data = await api.share.create.mutate({ chatId });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const data = await api.share.list.query({ limit, offset });

    if (!data) {
      return NextResponse.json(
        { error: 'Shared link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
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
    await api.share.deleteAll.mutate();
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}
