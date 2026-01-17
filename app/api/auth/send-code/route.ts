import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { z } from 'zod';

import { sendVerificationCode } from '@/lib/email';
import { env } from '@/lib/env';
import { generateUUID } from '@/lib/utils';
import { db } from '@/server/db';
import { emailVerificationCodes } from '@/server/db/schema';

const sendCodeSchema = z.object({
  email: z.string().email('Invalid email address')
});

// Verification code expires in 10 minutes
const CODE_EXPIRY_MINUTES = 10;

// Rate limit: minimum 60 seconds between requests for the same email
const RATE_LIMIT_SECONDS = 60;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  if (!env.AUTH_EMAIL_ENABLED) {
    return NextResponse.json(
      { error: 'Email authentication is not enabled' },
      { status: 403 }
    );
  }

  try {
    const json = await req.json();
    const result = sendCodeSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid email' },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limit - find most recent code for this email
    const recentCode = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, normalizedEmail),
          gt(
            emailVerificationCodes.createdAt,
            new Date(Date.now() - RATE_LIMIT_SECONDS * 1000)
          )
        )
      )
      .limit(1);

    if (recentCode.length > 0) {
      const waitSeconds = Math.ceil(
        (recentCode[0].createdAt.getTime() +
          RATE_LIMIT_SECONDS * 1000 -
          Date.now()) /
          1000
      );
      return NextResponse.json(
        {
          error: `Please wait ${waitSeconds} seconds before requesting a new code`
        },
        { status: 429 }
      );
    }

    // Delete any existing codes for this email
    await db
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.email, normalizedEmail));

    // Generate new code
    const code = generateCode();
    const expires = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // Store in database
    await db.insert(emailVerificationCodes).values({
      id: generateUUID(),
      email: normalizedEmail,
      code,
      expires
    });

    // Send email
    const emailResult = await sendVerificationCode(normalizedEmail, code);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send verification code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending the verification code' },
      { status: 500 }
    );
  }
}
