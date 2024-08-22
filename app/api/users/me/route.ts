import { NextResponse } from 'next/server';

import { auth } from '@/server/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(session.user);
}
