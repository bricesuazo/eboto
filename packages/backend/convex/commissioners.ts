import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { ConvexError, v } from 'convex/values';

import { api, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import {
  internalAction,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { requireCommissioner, requireUser } from './_helpers/auth';

/**
 * Lists active commissioners for an election. Caller must already be a
 * commissioner. We resolve to the auth `users` table to surface the email
 * + name for the management UI; both come from Convex Auth's `authTables`.
 */
export const list = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const rows = await ctx.db
      .query('commissioners')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    return await Promise.all(
      rows.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        return {
          _id: row._id,
          _creationTime: row._creationTime,
          userId: row.userId,
          email: user?.email ?? null,
          name: user?.name ?? null,
        };
      }),
    );
  },
});

/**
 * Lists outstanding (not yet accepted/declined/cancelled) commissioner
 * invites for an election. Shown alongside `list` in the settings UI so the
 * inviter can see who hasn't responded yet.
 */
export const listInvites = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    return await ctx.db
      .query('commissioner_invites')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) =>
        q.and(
          q.eq(q.field('acceptedAt'), undefined),
          q.eq(q.field('declinedAt'), undefined),
          q.eq(q.field('deletedAt'), undefined),
        ),
      )
      .collect();
  },
});

/**
 * Returns outstanding commissioner invites addressed to the signed-in user's
 * email, alongside whether they can accept right now (i.e. they have an
 * unused free slot or an unredeemed Plus credit). The dashboard surfaces
 * these so the invitee can accept or decline.
 */
export const myPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const quota = await loadInviteeQuota(ctx, userId);
    const empty = {
      invites: [] as {
        _id: Id<'commissioner_invites'>;
        electionId: Id<'elections'>;
        electionName: string;
        electionSlug: string;
        invitedByName: string | null;
        invitedByEmail: string | null;
        _creationTime: number;
      }[],
      ...quota,
    };

    const user = await ctx.db.get(userId);
    const email = user?.email?.trim().toLowerCase();
    if (!email) return empty;

    const invites = await ctx.db
      .query('commissioner_invites')
      .withIndex('by_email', (q) => q.eq('email', email))
      .filter((q) =>
        q.and(
          q.eq(q.field('acceptedAt'), undefined),
          q.eq(q.field('declinedAt'), undefined),
          q.eq(q.field('deletedAt'), undefined),
        ),
      )
      .collect();

    const hydrated = await Promise.all(
      invites.map(async (invite) => {
        const election = await ctx.db.get(invite.electionId);
        if (!election || election.deletedAt) return null;
        const inviter = await ctx.db.get(invite.invitedByUserId);
        return {
          _id: invite._id,
          electionId: invite.electionId,
          electionName: election.name,
          electionSlug: election.slug,
          invitedByName: inviter?.name ?? null,
          invitedByEmail: inviter?.email ?? null,
          _creationTime: invite._creationTime,
        };
      }),
    );
    const visible = hydrated.filter(
      (entry): entry is NonNullable<typeof entry> => entry !== null,
    );

    return {
      ...empty,
      invites: visible,
    };
  },
});

/**
 * Adds a commissioner by email. The inviter never pays — instead, an invite
 * row is created and the invitee gets an email asking them to accept. The
 * invitee's free slot or one of their Plus credits is consumed on accept
 * (see `acceptInvite`).
 *
 * The flow is identical whether the email already has an eBoto account or
 * not: we always go through the invite table so the invitee gets a say
 * (existing commissioners had been previously added silently without their
 * consent, which made unwanted "co-ownership" possible).
 */
export const addByEmail = mutation({
  args: {
    electionId: v.id('elections'),
    email: v.string(),
  },
  handler: async (ctx, { electionId, email }) => {
    const { userId: inviterId } = await requireCommissioner(ctx, electionId);
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Email is required.',
      });
    }

    // If the email matches an existing user who is *already* an active
    // commissioner of this election, short-circuit with a friendly message.
    const existingUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', normalized))
      .first();
    if (existingUser) {
      const existingCommissioner = await ctx.db
        .query('commissioners')
        .withIndex('by_user_election', (q) =>
          q.eq('userId', existingUser._id).eq('electionId', electionId),
        )
        .first();
      if (existingCommissioner && !existingCommissioner.deletedAt) {
        throw new ConvexError({
          code: 'conflict',
          message: 'They are already a commissioner of this election.',
        });
      }
    }

    const pending = await ctx.db
      .query('commissioner_invites')
      .withIndex('by_election_email', (q) =>
        q.eq('electionId', electionId).eq('email', normalized),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('acceptedAt'), undefined),
          q.eq(q.field('declinedAt'), undefined),
          q.eq(q.field('deletedAt'), undefined),
        ),
      )
      .first();
    if (pending) {
      throw new ConvexError({
        code: 'conflict',
        message: 'There is already a pending invite for that email.',
      });
    }

    const inviteId = await ctx.db.insert('commissioner_invites', {
      electionId,
      email: normalized,
      invitedByUserId: inviterId,
    });

    await ctx.scheduler.runAfter(0, internal.commissioners.sendInviteEmail, {
      email: normalized,
      electionId,
      invitedByUserId: inviterId,
      hasAccount: Boolean(existingUser),
    });

    return { inviteId, hasAccount: Boolean(existingUser) };
  },
});

/**
 * Cancels an outstanding invite. Caller must be a commissioner of the same
 * election. Idempotent — already accepted/declined/cancelled rows are
 * left untouched and we throw a friendly not_found.
 */
export const cancelInvite = mutation({
  args: { inviteId: v.id('commissioner_invites') },
  handler: async (ctx, { inviteId }) => {
    const invite = await ctx.db.get(inviteId);
    if (!invite || invite.deletedAt || invite.acceptedAt || invite.declinedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Invite not found.',
      });
    }
    await requireCommissioner(ctx, invite.electionId);
    await ctx.db.patch(invite._id, { deletedAt: Date.now() });
  },
});

/**
 * Invitee accepts an outstanding invite. Consumes one of their Plus credits
 * if they already have an active commissioner row anywhere; otherwise their
 * first commissioner role is free (matches the election-creation quota).
 *
 * If they have no free slot and no credit, throws so the UI can prompt them
 * to buy Plus before retrying.
 */
export const acceptInvite = mutation({
  args: { inviteId: v.id('commissioner_invites') },
  handler: async (ctx, { inviteId }) => {
    const userId = await requireUser(ctx);
    const invite = await ctx.db.get(inviteId);
    if (!invite || invite.deletedAt || invite.acceptedAt || invite.declinedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Invite not found.',
      });
    }

    const user = await ctx.db.get(userId);
    if (user?.email?.trim().toLowerCase() !== invite.email) {
      throw new ConvexError({
        code: 'forbidden',
        message: 'This invite is for a different email address.',
      });
    }

    const election = await ctx.db.get(invite.electionId);
    if (!election || election.deletedAt) {
      await ctx.db.patch(invite._id, { deletedAt: Date.now() });
      throw new ConvexError({
        code: 'not_found',
        message: 'Election no longer exists.',
      });
    }

    // Existing commissioner row? Could only happen if a previously soft-
    // deleted one is lingering — restore it without charging anything.
    const existing = await ctx.db
      .query('commissioners')
      .withIndex('by_user_election', (q) =>
        q.eq('userId', userId).eq('electionId', invite.electionId),
      )
      .first();
    if (existing && !existing.deletedAt) {
      await ctx.db.patch(invite._id, { acceptedAt: Date.now() });
      return;
    }

    const quota = await loadInviteeQuota(ctx, userId);
    if (!quota.canAcceptFree && !quota.canAcceptWithCredit) {
      throw new ConvexError({
        code: 'forbidden',
        message:
          "You're out of free commissioner slots — purchase a Plus credit to accept this invite.",
      });
    }

    if (quota.canAcceptWithCredit) {
      const credit = await ctx.db
        .query('elections_plus')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .filter((q) =>
          q.and(
            q.eq(q.field('redeemedAt'), undefined),
            q.eq(q.field('deletedAt'), undefined),
          ),
        )
        .first();
      if (!credit) {
        // Race: quota said "credit available" but it was redeemed between
        // the quota query and here. Throw rather than silently consuming
        // nothing — the UI will retell the user to buy Plus.
        throw new ConvexError({
          code: 'forbidden',
          message: 'No Plus credit available. Purchase Plus and try again.',
        });
      }
      await ctx.db.patch(credit._id, { redeemedAt: Date.now() });
    }

    if (existing) {
      await ctx.db.patch(existing._id, { deletedAt: undefined });
    } else {
      await ctx.db.insert('commissioners', {
        userId,
        electionId: invite.electionId,
      });
    }
    await ctx.db.patch(invite._id, { acceptedAt: Date.now() });
  },
});

/**
 * Invitee declines an invite. No credit is consumed. Idempotent on already-
 * resolved invites.
 */
export const declineInvite = mutation({
  args: { inviteId: v.id('commissioner_invites') },
  handler: async (ctx, { inviteId }) => {
    const userId = await requireUser(ctx);
    const invite = await ctx.db.get(inviteId);
    if (!invite || invite.deletedAt || invite.acceptedAt || invite.declinedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Invite not found.',
      });
    }
    const user = await ctx.db.get(userId);
    if (user?.email?.trim().toLowerCase() !== invite.email) {
      throw new ConvexError({
        code: 'forbidden',
        message: 'This invite is for a different email address.',
      });
    }
    await ctx.db.patch(invite._id, { declinedAt: Date.now() });
  },
});

/**
 * Soft-removes a commissioner from an election. The last active commissioner
 * can't remove themselves — the election would be orphaned. We also refuse
 * self-removal when the caller has no other commissioner to take over (a
 * safer rule than letting the only commissioner orphan their own election).
 */
export const remove = mutation({
  args: { commissionerId: v.id('commissioners') },
  handler: async (ctx, { commissionerId }) => {
    const callerId = await requireUser(ctx);
    const target = await ctx.db.get(commissionerId);
    if (!target || target.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Commissioner not found.',
      });
    }
    await requireCommissioner(ctx, target.electionId);

    const active = await ctx.db
      .query('commissioners')
      .withIndex('by_election', (q) => q.eq('electionId', target.electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    if (active.length <= 1) {
      throw new ConvexError({
        code: 'forbidden',
        message:
          "Can't remove the last commissioner — add another first or delete the election.",
      });
    }
    if (target.userId === callerId && active.length === 2) {
      // Caller is one of two — removing themselves leaves a single commissioner.
      // That's allowed; only the *last* commissioner is protected above.
    }
    await ctx.db.patch(target._id, { deletedAt: Date.now() });
  },
});

/* ------------------------------------------------------------------ */
/* Internal helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Quota check used by `myPendingInvites` and `acceptInvite`. Matches the
 * election-creation quota in `billing.myElectionQuota`: first commissioner
 * role is free, every additional one consumes an unredeemed Plus credit.
 */
async function loadInviteeQuota(
  ctx: { db: QueryCtx['db'] },
  userId: Id<'users'>,
) {
  const owned = await ctx.db
    .query('commissioners')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('deletedAt'), undefined))
    .collect();
  let activeOwnedCount = 0;
  for (const c of owned) {
    const election = await ctx.db.get(c.electionId);
    if (election && !election.deletedAt) activeOwnedCount++;
  }
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
  return {
    activeOwnedCount,
    plusCredits: credits.length,
    canAcceptFree: activeOwnedCount === 0,
    canAcceptWithCredit: activeOwnedCount > 0 && credits.length > 0,
  };
}

/* ------------------------------------------------------------------ */
/* Internal: email send                                                 */
/* ------------------------------------------------------------------ */

interface InviteEmailInviter {
  name?: string;
  email?: string;
}

export const getInviterPreview = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }): Promise<InviteEmailInviter | null> => {
    const user: Doc<'users'> | null = await ctx.db.get(userId);
    if (!user) return null;
    return { name: user.name, email: user.email };
  },
});

function siteOrigin(): string {
  return process.env.SITE_URL ?? 'https://eboto.app';
}

function fromAddress(): string {
  return process.env.SES_FROM_EMAIL ?? 'eBoto <no-reply@eboto.app>';
}

/**
 * Sends the commissioner-invite notification email via SES. Same template
 * for both paths: existing-account adds get a direct sign-in link; brand-
 * new emails get the same link with instructions to sign up. Either way
 * the link lands them on the account page where the pending invite is
 * surfaced with explicit accept/decline buttons.
 */
export const sendInviteEmail = internalAction({
  args: {
    email: v.string(),
    electionId: v.id('elections'),
    invitedByUserId: v.id('users'),
    hasAccount: v.boolean(),
  },
  handler: async (ctx, { email, electionId, invitedByUserId, hasAccount }) => {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set',
      );
    }
    const election = await ctx.runQuery(api.elections.getPublicById, {
      id: electionId,
    });
    if (!election) return;

    const inviter: InviteEmailInviter | null = await ctx.runQuery(
      internal.commissioners.getInviterPreview,
      { userId: invitedByUserId },
    );
    const inviterLabel = inviter?.name ?? inviter?.email ?? 'A commissioner';

    const origin = siteOrigin();
    const accountUrl = `${origin}/account`;
    const signInUrl = `${origin}/sign-in?to=${encodeURIComponent('/account')}`;
    const linkUrl = hasAccount ? accountUrl : signInUrl;
    const linkLabel = hasAccount
      ? 'Open your account to accept or decline'
      : 'Sign in to accept or decline';

    const subject = `You were invited to commission ${election.name} on eBoto`;
    const intro = hasAccount
      ? `${inviterLabel} invited you to commission <strong>${election.name}</strong> on eBoto. Visit your account to accept or decline.`
      : `${inviterLabel} invited you to commission <strong>${election.name}</strong> on eBoto. Sign in with this email address (<strong>${email}</strong>) to accept or decline.`;
    const introText = hasAccount
      ? `${inviterLabel} invited you to commission ${election.name} on eBoto. Visit your account to accept or decline.`
      : `${inviterLabel} invited you to commission ${election.name} on eBoto. Sign in with this email address (${email}) to accept or decline.`;

    const html = `<p>Hi,</p>
      <p>${intro}</p>
      <p>Accepting an invite uses one of your free commissioner slots or one of your Plus credits. If you don't want to accept, you can decline and the invite goes away.</p>
      <p><a href="${linkUrl}">${linkLabel}</a></p>
      <p>— eBoto</p>`;
    const text = `${introText}\n\nAccepting an invite uses one of your free commissioner slots or one of your Plus credits. If you don't want to accept, you can decline and the invite goes away.\n\n${linkLabel}: ${linkUrl}\n\n— eBoto`;

    const ses = new SESv2Client({
      region: process.env.AWS_REGION ?? 'ap-southeast-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: fromAddress(),
        Destination: { ToAddresses: [email] },
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
  },
});
