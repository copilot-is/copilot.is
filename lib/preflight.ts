import 'server-only';

import { NextResponse } from 'next/server';

import { PricingMissingError, requirePricing } from '@/lib/pricing';
import {
  assertModelAccess,
  assertQuota,
  ModelAccessDeniedError,
  QuotaExceededError
} from '@/lib/quota';

/**
 * Run the standard pre-flight gates for any generation API:
 *   1. Model must have a pricing row                 → 403
 *   2. User's resolved quota must allow this model   → 403
 *   3. User must be under their quota windows        → 429 (with resetAt)
 *
 * `modelKey` is the modelId string (e.g. "gpt-4o"); used for both the pricing
 * lookup and the quota model-whitelist check (quota.allowedModelIds stores
 * modelId strings, matching everywhere else in the system).
 *
 * Returns a NextResponse to bail out with, or null to proceed.
 */
export async function preflightGate(args: {
  userId: string;
  modelKey: string;
  modelLabel: string;
  capability: 'chat' | 'image' | 'video' | 'audio';
}): Promise<NextResponse | null> {
  try {
    await requirePricing(args.modelKey, args.capability, args.modelLabel);
    await assertModelAccess(args.userId, args.modelKey, args.modelLabel);
    await assertQuota(args.userId);
    return null;
  } catch (err) {
    if (err instanceof PricingMissingError) {
      // Log the admin-facing detail (which model, what's missing) so the
      // misconfiguration is discoverable; the user only sees a generic
      // "unavailable, pick another model" message.
      console.error(`[preflight] ${err.message}`);
      return NextResponse.json({ error: err.userMessage }, { status: 403 });
    }
    if (err instanceof ModelAccessDeniedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QuotaExceededError) {
      // Plain `{ error }` only — the live UsageLimitAlert (powered by
      // `quota.me`) already shows the user the remaining-% gauge + countdown
      // when they're exhausted, so the 429 doesn't need structured detail.
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }
}
