import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

import { auth } from '@/server/auth';

export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  const decodedUrl = decodeURIComponent(url);
  const userId = new URL(decodedUrl).pathname.substring(1).split('/')[0];
  if (session.user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await del(decodedUrl);

    return new Response(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
