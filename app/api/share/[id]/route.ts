import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

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
    await api.share.delete({ id });
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Oops, an error occured!' },
      { status: 500 }
    );
  }
}
