import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { httpAction } from './_generated/server';

/**
 * Voter unsubscribe endpoint. Lives in its own (non-`"use node"`) module
 * because the email-sending actions in `voterBlast.ts` require the Node
 * runtime, and Convex forbids an `httpAction` in a Node module. The HMAC
 * verification here only uses Web Crypto (`crypto.subtle`), which is available
 * in the default Convex runtime — and the matching `signUnsubscribeToken`
 * lives next to the sender in `voterBlast.ts`.
 *
 * Two paths share this endpoint:
 *   - GET  /api/unsubscribe?t=<token> — clicked from email body, renders HTML
 *   - POST /api/unsubscribe?t=<token> — RFC 8058 one-click unsubscribe
 *     (inbox providers POST here on the user's behalf)
 *
 * Both verify the HMAC token and call `internal.voters.markUnsubscribed`.
 * Idempotent.
 */
export const handleUnsubscribe = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('t') ?? '';
  const parsed = await verifyUnsubscribeToken(token);
  if (!parsed) {
    return new Response(htmlPage('Invalid or expired unsubscribe link.'), {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  const result = await ctx.runMutation(internal.voters.markUnsubscribed, {
    voterId: parsed.voterId as Id<'voters'>,
  });
  const body = result.ok
    ? htmlPage(
        result.alreadyOptedOut
          ? "You're already unsubscribed. No further election emails will be sent."
          : "You've been unsubscribed. We won't email you about this election again.",
      )
    : htmlPage('That voter could not be found.');
  return new Response(body, {
    status: result.ok ? 200 : 404,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
});

async function verifyUnsubscribeToken(
  token: string,
): Promise<{ electionId: string; voterId: string } | null> {
  if (!token) return null;
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) return null;
  const [payloadB64, sigHex] = token.split('.');
  if (!payloadB64 || !sigHex) return null;
  let payload: string;
  try {
    payload = atob(payloadB64.replaceAll('-', '+').replaceAll('_', '/'));
  } catch {
    return null;
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const expectedHex = [...new Uint8Array(expected)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (!timingSafeEqual(sigHex, expectedHex)) return null;
  const [electionId, voterId] = payload.split(':');
  if (!electionId || !voterId) return null;
  return { electionId, voterId };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function htmlPage(message: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Unsubscribe — eBoto</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fafafa;color:#222}main{max-width:32rem;padding:2rem;text-align:center}h1{font-size:1.25rem;margin:0 0 0.5rem}p{margin:0;color:#555}</style></head><body><main><h1>eBoto</h1><p>${message}</p></main></body></html>`;
}
