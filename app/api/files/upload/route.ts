import path from 'path';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { z } from 'zod';

import { env } from '@/lib/env';
import { auth } from '@/server/auth';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine(file => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB'
    })
    // Update the file type based on the kind of files you want to accept
    .refine(file => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'File type should be JPEG or PNG'
    })
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
    const errorMessage = validatedFile.error.message;
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  // Get filename from formData since Blob doesn't have name property
  const filename = (formData.get('file') as File).name;
  const fileBuffer = await file.arrayBuffer();

  try {
    const uploadPath = env.UPLOAD_PATH;
    const pathname = path.join(
      uploadPath,
      'attachments',
      session.user.id,
      filename
    );
    const data = await put(pathname, fileBuffer, {
      access: 'public'
    });
    const { url, pathname: name, contentType } = data;

    return NextResponse.json({ url, name, contentType });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
