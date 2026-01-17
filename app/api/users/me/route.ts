import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch full user data from database
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    image: user[0].image,
    admin: session.user.admin
  });
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional()
});

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const result = updateProfileSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const { name, image } = result.data;

    const updates: { name?: string; image?: string } = {};
    if (name !== undefined) updates.name = name;
    if (image !== undefined) updates.image = image;

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, session.user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
