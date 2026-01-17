import path from 'path';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { env } from '@/lib/env';
import { generateUUID } from '@/lib/utils';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine(file => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB'
    })
    .refine(
      file =>
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
          file.type
        ),
      {
        message: 'File type should be JPEG, PNG, GIF, or WebP'
      }
    )
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as Blob;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const validatedFile = FileSchema.safeParse({ file });

  if (!validatedFile.success) {
    const errorMessage =
      validatedFile.error.issues[0]?.message || 'Invalid file';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  const fileBuffer = await file.arrayBuffer();
  const ext = file.type.split('/')[1] || 'png';
  const filename = `${generateUUID()}.${ext}`;

  try {
    const pathname = path.join(
      env.UPLOAD_PATH,
      'avatars',
      session.user.id,
      filename
    );
    const data = await put(pathname, fileBuffer, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false
    });

    // Update user's image in database
    await db
      .update(users)
      .set({ image: data.url })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
