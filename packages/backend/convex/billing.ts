import { v } from 'convex/values';
import { httpAction, internalMutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { requireUser } from './_helpers/auth';
import type { Id } from './_generated/dataModel';

/**
 * Internal mutation invoked from the LemonSqueezy webhook HTTP action below.
 * Grants the user one "elections_plus" credit, redeemable when they create
 * their next election.
 */
export const grantElectionsPlus = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    await ctx.db.insert('elections_plus', { userId });
  },
});

/** Number of unredeemed credits the current user has. */
export const myCreditCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const credits = await ctx.db
      .query('elections_plus')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.eq(q.field('redeemedAt'), undefined),
          q.eq(q.field('deletedAt'), undefined),
        ),
      )
      .collect();
    return credits.length;
  },
});

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string };
  };
}

/**
 * LemonSqueezy webhook endpoint. Mounted at
 *   POST https://<deployment>.convex.site/billing/webhook
 * (see `convex/http.ts` for routing).
 *
 * Verifies the HMAC-SHA256 signature against `LEMONSQUEEZY_WEBHOOK_SECRET`
 * (configured in the Convex dashboard), then dispatches based on
 * `meta.event_name`. Today we only handle `order_created`, which grants one
 * elections_plus credit to the buying user.
 */
export const lemonWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return new Response('Server misconfigured: missing webhook secret', {
      status: 500,
    });
  }

  const raw = await request.text();
  const signature = request.headers.get('x-signature') ?? '';

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(raw));
  const expected = [...new Uint8Array(sigBuf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (!constantTimeEqual(signature, expected)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(raw) as LemonWebhookPayload;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;
  if (event === 'order_created' && userId) {
    await ctx.runMutation(internal.billing.grantElectionsPlus, {
      userId: userId as Id<'users'>,
    });
  }

  return new Response(null, { status: 204 });
});

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
