import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { ConvexError, v } from 'convex/values';

import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { action, httpAction, internalAction } from './_generated/server';
import { voterNotificationPhase } from './schema';

/**
 * Lifecycle email blast.
 *
 * Two entry points:
 *   - {@link runLifecycle} — public action called by the Inngest worker once
 *     the election's start/end moment arrives. Validates a shared secret,
 *     then paginates over voters and schedules a {@link processBatch} run
 *     for each chunk via `ctx.scheduler.runAfter`. Stagger between batches
 *     gives a soft rate limit independent of SES's per-second cap.
 *   - {@link processBatch} — internal action that sends one batch (up to
 *     ~50 voters) through AWS SES v2. Idempotency comes from
 *     `voter_notifications` rows: a per-voter pre-check skips already-sent
 *     recipients, and the post-send insert records outcome for audit + dedup
 *     on retry.
 *
 * The send pipeline is intentionally Convex-resident: voter PII never leaves
 * the deployment, the SES credentials live in one place, and Convex
 * automatically retries failed actions.
 */

/** Tuned for SES's default 14 msg/sec sending rate. At 50 emails per batch
 *  and 4s between batch starts, peak rate stays around 12/sec. Raise both
 *  numbers once SES sending limits are increased. */
const BATCH_SIZE = 50;
const STAGGER_MS = 4_000;
/** Within-batch concurrency cap so we don't fire 50 SES requests at once. */
const SEND_CONCURRENCY = 10;
/** Hard cap so a runaway voter table can't fan out unbounded scheduled work
 *  in one go. Beyond this the action returns and a follow-up call resumes. */
const MAX_BATCHES_PER_RUN = 500;

interface ElectionForEmail {
  _id: string;
  slug: string;
  name: string;
  startDate: number;
  endDate: number;
}

function siteOrigin(): string {
  return process.env.SITE_URL ?? 'https://eboto.app';
}

function fromAddress(): string {
  return process.env.SES_FROM_EMAIL ?? 'eBoto <no-reply@eboto.app>';
}

function awsRegion(): string {
  return process.env.AWS_REGION ?? 'ap-southeast-1';
}

function buildEmail(
  phase: 'start' | 'end',
  election: ElectionForEmail,
  unsubscribeUrl: string,
): { subject: string; html: string; text: string } {
  const url = `${siteOrigin()}/${election.slug}`;
  const footerHtml = `<p style="color:#888;font-size:12px;margin-top:24px">If you no longer want emails about this election, <a href="${unsubscribeUrl}">unsubscribe</a>.</p>`;
  const footerText = `\n\nDon't want these emails? Unsubscribe: ${unsubscribeUrl}`;
  if (phase === 'start') {
    return {
      subject: `${election.name} is now open for voting`,
      text: `${election.name} is open. Cast your ballot at ${url}${footerText}`,
      html: `<p>Hi voter,</p><p><strong>${election.name}</strong> is now open. Cast your ballot:</p><p><a href="${url}">${url}</a></p><p>— eBoto</p>${footerHtml}`,
    };
  }
  return {
    subject: `${election.name} has ended`,
    text: `${election.name} has ended. View results at ${url}${footerText}`,
    html: `<p>Hi voter,</p><p><strong>${election.name}</strong> has now ended. Final results:</p><p><a href="${url}">${url}</a></p><p>Thanks for participating.</p><p>— eBoto</p>${footerHtml}`,
  };
}

/**
 * HMAC-signed unsubscribe token. Encodes `(electionId, voterId)` so each link
 * can only opt the matching voter out — guessing voter IDs gets the attacker
 * nowhere without the secret.
 *
 * Format: `base64url(payload).hex(hmac_sha256(secret, payload))`
 *
 * `UNSUBSCRIBE_SECRET` is required in production. We refuse to mint a token
 * without it so a misconfigured env can't ship a publicly-guessable link.
 */
async function signUnsubscribeToken(
  electionId: string,
  voterId: string,
): Promise<string> {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error(
      'UNSUBSCRIBE_SECRET env var is required to send voter emails',
    );
  }
  const payload = `${electionId}:${voterId}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const hex = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const b64 = btoa(payload)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  return `${b64}.${hex}`;
}

function unsubscribeUrlFor(token: string): string {
  // Routes to the Convex deployment's HTTP host (not the marketing site),
  // since the unsubscribe handler is mounted in `http.ts`. Convex injects
  // `CONVEX_SITE_URL` at runtime in every deployment.
  const base = process.env.CONVEX_SITE_URL ?? '';
  const params = new URLSearchParams({ t: token });
  return `${base}/api/unsubscribe?${params.toString()}`;
}

/**
 * SES client cached per region per warm action invocation. Cold starts pay
 * the constructor cost once.
 */
let cachedSes: SESv2Client | null = null;
function getSes(): SESv2Client {
  if (cachedSes) return cachedSes;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set');
  }

  cachedSes = new SESv2Client({
    region: awsRegion(),
    credentials: { accessKeyId, secretAccessKey },
    // When AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are set in env the SDK
    // picks them up automatically; passing nothing here lets IAM roles or
    // other credential providers work too.
  });
  return cachedSes;
}

/** Bounded-parallelism runner. Resolves once every task settles. */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= tasks.length) return;
      const task = tasks[i];
      if (!task) return;
      try {
        results[i] = { status: 'fulfilled', value: await task() };
      } catch (err) {
        results[i] = { status: 'rejected', reason: err };
      }
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * Public entry point hit by the Inngest worker. The shared secret in
 * `BLAST_TRIGGER_SECRET` keeps random callers from kicking off a blast —
 * the function name is enumerable but the secret isn't.
 */
export const runLifecycle = action({
  args: {
    electionId: v.id('elections'),
    phase: voterNotificationPhase,
    secret: v.string(),
    /** Cursor for resuming across multiple `runLifecycle` calls when an
     *  election's voter count exceeds `MAX_BATCHES_PER_RUN * BATCH_SIZE`. */
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { electionId, phase, secret, cursor }) => {
    const expected = process.env.BLAST_TRIGGER_SECRET;
    if (!expected || secret !== expected) {
      throw new ConvexError({
        code: 'unauthorized',
        message: 'Invalid blast trigger secret',
      });
    }

    const election = await ctx.runQuery(api.elections.getPublicById, {
      id: electionId,
    });
    if (!election) return { skipped: true as const, reason: 'no-election' };

    let nextCursor: string | null = cursor ?? null;
    let scheduled = 0;
    let voterCount = 0;

    while (scheduled < MAX_BATCHES_PER_RUN) {
      const page = await ctx.runQuery(internal.voters.listForBlast, {
        electionId,
        cursor: nextCursor,
        pageSize: BATCH_SIZE,
      });
      if (page.voters.length > 0) {
        await ctx.scheduler.runAfter(
          scheduled * STAGGER_MS,
          internal.voterBlast.processBatch,
          {
            electionId,
            phase,
            voterIds: page.voters.map((v) => v._id),
            batchIndex: scheduled,
          },
        );
        scheduled += 1;
        voterCount += page.voters.length;
      }
      if (page.isDone) {
        nextCursor = null;
        break;
      }
      nextCursor = page.continueCursor;
    }

    // If we hit the cap, hand the rest off to a follow-up run far enough out
    // that the in-flight batches have begun firing.
    if (nextCursor) {
      await ctx.scheduler.runAfter(
        scheduled * STAGGER_MS + 1_000,
        internal.voterBlast.continueLifecycle,
        { electionId, phase, cursor: nextCursor },
      );
    }

    return {
      skipped: false as const,
      batches: scheduled,
      voters: voterCount,
      done: nextCursor === null,
    };
  },
});

/**
 * Internal resume hook — re-enters the paginator without re-checking the
 * secret (Convex scheduler is trusted). Mirrors `runLifecycle`'s loop body.
 */
export const continueLifecycle = internalAction({
  args: {
    electionId: v.id('elections'),
    phase: voterNotificationPhase,
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { electionId, phase, cursor }) => {
    const election = await ctx.runQuery(api.elections.getPublicById, {
      id: electionId,
    });
    if (!election) return { skipped: true as const };

    let nextCursor: string | null = cursor;
    let scheduled = 0;
    let voterCount = 0;

    while (scheduled < MAX_BATCHES_PER_RUN) {
      const page = await ctx.runQuery(internal.voters.listForBlast, {
        electionId,
        cursor: nextCursor,
        pageSize: BATCH_SIZE,
      });
      if (page.voters.length > 0) {
        await ctx.scheduler.runAfter(
          scheduled * STAGGER_MS,
          internal.voterBlast.processBatch,
          {
            electionId,
            phase,
            voterIds: page.voters.map((v) => v._id),
            batchIndex: scheduled,
          },
        );
        scheduled += 1;
        voterCount += page.voters.length;
      }
      if (page.isDone) {
        nextCursor = null;
        break;
      }
      nextCursor = page.continueCursor;
    }

    if (nextCursor) {
      await ctx.scheduler.runAfter(
        scheduled * STAGGER_MS + 1_000,
        internal.voterBlast.continueLifecycle,
        { electionId, phase, cursor: nextCursor },
      );
    }

    return { skipped: false as const, batches: scheduled, voters: voterCount };
  },
});

/**
 * Sends one batch of ~50 voter emails through SES, then records a
 * `voter_notifications` row per voter (success or failure).
 *
 * Skips voters that already have a `voter_notifications` row for this
 * `(electionId, voterId, phase)` so a re-run after partial failure won't
 * double-send. SES has no native idempotency key, so we rely on that
 * pre-check plus our post-send insert.
 */
export const processBatch = internalAction({
  args: {
    electionId: v.id('elections'),
    phase: voterNotificationPhase,
    voterIds: v.array(v.id('voters')),
    batchIndex: v.number(),
  },
  handler: async (ctx, { electionId, phase, voterIds, batchIndex }) => {
    const election = await ctx.runQuery(api.elections.getPublicById, {
      id: electionId,
    });
    if (!election) return { skipped: true as const, reason: 'no-election' };

    // Pull voters in parallel + filter out already-notified and opted-out
    // voters. Unsubscribed voters get a `voter_notifications` row with the
    // synthetic `unsubscribed` provider id so the operator can audit suppress
    // counts — and so a future re-emit doesn't bother re-checking them.
    const voters: { _id: Id<'voters'>; email: string }[] = [];
    const optedOut: string[] = [];
    await Promise.all(
      voterIds.map(async (voterId) => {
        const [voter, existing] = await Promise.all([
          ctx.runQuery(internal.voters.getForBlast, { voterId }),
          ctx.runQuery(internal.voters.getNotification, {
            electionId,
            voterId,
            phase,
          }),
        ]);
        if (!voter || existing) return;
        if (voter.unsubscribedAt) {
          optedOut.push(voter._id);
          return;
        }
        voters.push({ _id: voter._id, email: voter.email });
      }),
    );

    // Record suppression so re-runs don't keep re-checking.
    await Promise.all(
      optedOut.map((voterId) =>
        ctx.runMutation(internal.voters.recordNotification, {
          electionId,
          voterId,
          phase,
          status: 'sent',
          providerId: 'unsubscribed',
        }),
      ),
    );

    if (voters.length === 0) {
      return { sent: 0, skipped: optedOut.length, batchIndex };
    }

    const ses = getSes();
    const fromEmail = fromAddress();
    const configurationSet = process.env.SES_CONFIGURATION_SET;

    const tasks = voters.map((voter) => async () => {
      const token = await signUnsubscribeToken(
        String(electionId),
        String(voter._id),
      );
      const unsubscribeUrl = unsubscribeUrlFor(token);
      const { subject, html, text } = buildEmail(
        phase,
        election,
        unsubscribeUrl,
      );
      const command = new SendEmailCommand({
        FromEmailAddress: fromEmail,
        Destination: { ToAddresses: [voter.email] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
              Text: { Data: text, Charset: 'UTF-8' },
            },
            Headers: [
              { Name: 'List-Unsubscribe', Value: `<${unsubscribeUrl}>` },
              {
                Name: 'List-Unsubscribe-Post',
                Value: 'List-Unsubscribe=One-Click',
              },
            ],
          },
        },
        ConfigurationSetName: configurationSet,
      });
      const response = await ses.send(command);
      return { voter, messageId: response.MessageId };
    });

    const results = await runWithConcurrency(tasks, SEND_CONCURRENCY);

    let sent = 0;
    let failed = 0;
    await Promise.all(
      results.map(async (result, i) => {
        const voter = voters[i];
        if (!voter) return;
        if (result.status === 'fulfilled') {
          sent += 1;
          await ctx.runMutation(internal.voters.recordNotification, {
            electionId,
            voterId: voter._id,
            phase,
            status: 'sent',
            providerId: result.value.messageId,
          });
        } else {
          failed += 1;
          const message =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
          await ctx.runMutation(internal.voters.recordNotification, {
            electionId,
            voterId: voter._id,
            phase,
            status: 'failed',
            error: message,
          });
        }
      }),
    );

    // Surface partial failure to Convex so the action shows up in the
    // failed-functions log, but only if *everything* failed (otherwise a
    // single bad address would mark the whole batch as failed forever —
    // the recorded `voter_notifications` rows are the authoritative state).
    if (failed > 0 && sent === 0) {
      throw new Error(
        `voterBlast batch ${batchIndex}: all ${failed} sends failed`,
      );
    }

    return { sent, failed, batchIndex };
  },
});

/* ------------------------------------------------------------------ */
/* Vote receipt                                                         */
/* ------------------------------------------------------------------ */

/**
 * Sends a "thanks for voting" email to one voter. Invoked from `votes.cast`
 * via `ctx.scheduler.runAfter(0, ...)` so the vote mutation itself stays
 * fast and the email send is retried by Convex on transient SES errors.
 *
 * No idempotency record — a duplicate scheduler call would re-send. The
 * caller only schedules once per successful insert; if you ever start
 * retrying `votes.cast` itself you'll want to add a guard here.
 */
export const sendVoteReceipt = internalAction({
  args: {
    electionId: v.id('elections'),
    voterEmail: v.string(),
  },
  handler: async (ctx, { electionId, voterEmail }) => {
    const election = await ctx.runQuery(api.elections.getPublicById, {
      id: electionId,
    });
    if (!election) return { skipped: true as const };

    const ses = getSes();
    const url = `${siteOrigin()}/${election.slug}/result`;
    const subject = `Your ballot was recorded — ${election.name}`;
    const text = `Thanks for voting in ${election.name}. View results when they're available: ${url}`;
    const html = `<p>Hi voter,</p><p>Your ballot in <strong>${election.name}</strong> has been recorded. Thanks for participating.</p><p>You can check the results page anytime: <a href="${url}">${url}</a></p><p>— eBoto</p>`;

    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: fromAddress(),
        Destination: { ToAddresses: [voterEmail] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
              Text: { Data: text, Charset: 'UTF-8' },
            },
          },
        },
        ConfigurationSetName: process.env.SES_CONFIGURATION_SET,
      }),
    );
    return { sent: true as const };
  },
});

/* ------------------------------------------------------------------ */
/* Unsubscribe                                                          */
/* ------------------------------------------------------------------ */

/**
 * HTTP unsubscribe handler. Two paths share this endpoint:
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
