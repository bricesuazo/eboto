import { ConvexError, v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { requireCommissioner, requireUser } from './_helpers/auth';
import { isFreeTier } from './_helpers/billing';

/**
 * Voter-side chat is a Boost-only feature. We gate every voter touchpoint
 * (room ensure, list, send) so a non-commissioner on a free election can't
 * open or write to a thread even by hitting the API directly.
 */
async function assertBoostForVoterChat(
  ctx: QueryCtx,
  electionId: Id<'elections'>,
) {
  const election = await ctx.db.get(electionId);
  if (!election || election.deletedAt) {
    throw new ConvexError({ code: 'not_found', message: 'Election not found' });
  }
  if (isFreeTier(election)) {
    throw new ConvexError({
      code: 'forbidden',
      message:
        'Voter messaging is a Boost feature. Ask the commissioner to upgrade.',
    });
  }
}

/* ------------------------------------------------------------------ */
/* commissioner ↔ voter                                                */
/* ------------------------------------------------------------------ */

/**
 * Lists every voter↔commissioner room for `electionId`. Caller must be a
 * commissioner. Room rows that don't have messages yet won't appear here —
 * voters create their own room on first send via `ensureMyVoterRoom`.
 */
export const listVoterRooms = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    await assertBoostForVoterChat(ctx, electionId);
    const rooms = await ctx.db
      .query('commissionersVotersRooms')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    return await Promise.all(
      rooms.map(async (room) => {
        const voter = room.voterId ? await ctx.db.get(room.voterId) : null;
        const lastMessage = await ctx.db
          .query('commissionersVotersMessages')
          .withIndex('by_room', (q) => q.eq('roomId', room._id))
          .order('desc')
          .first();
        return {
          _id: room._id,
          name: room.name,
          voterEmail: voter?.email ?? null,
          lastMessage: lastMessage
            ? {
                message: lastMessage.message,
                _creationTime: lastMessage._creationTime,
              }
            : null,
        };
      }),
    );
  },
});

/**
 * Returns the caller's voter room id for `electionId`, creating it on first
 * call. Errors when the caller isn't a registered voter for this election.
 * Commissioners use `listVoterRooms` instead — this query is voter-only.
 */
export const ensureMyVoterRoom = mutation({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await assertBoostForVoterChat(ctx, electionId);
    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new ConvexError({
        code: 'unauthorized',
        message: 'Account email is required',
      });
    }
    const voter = await voterForUser(ctx, electionId, user.email);
    if (!voter) {
      throw new ConvexError({
        code: 'forbidden',
        message: 'Not a registered voter for this election',
      });
    }
    const existing = await ctx.db
      .query('commissionersVotersRooms')
      .withIndex('by_election_voter', (q) =>
        q.eq('electionId', electionId).eq('voterId', voter._id),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert('commissionersVotersRooms', {
      name: user.email,
      voterId: voter._id,
      electionId,
    });
  },
});

/* ------------------------------------------------------------------ */
/* admin ↔ commissioner                                                */
/* ------------------------------------------------------------------ */

/**
 * Returns the single admin↔commissioner room for `electionId`, creating it
 * on first call by a commissioner. The platform admin (server-side, in a
 * separate app) reads/writes via its own credentials.
 */
export const ensureAdminRoom = mutation({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const existing = await ctx.db
      .query('adminCommissionersRooms')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (existing) return existing._id;
    const election = await ctx.db.get(electionId);
    return await ctx.db.insert('adminCommissionersRooms', {
      name: election?.name ?? 'Admin chat',
      electionId,
    });
  },
});

/* ------------------------------------------------------------------ */
/* shared: read + write messages, with per-side authorization           */
/* ------------------------------------------------------------------ */

/**
 * Lists messages for a room. `side` selects which table to read; auth is
 * enforced based on room membership rules below.
 */
export const listMessages = query({
  args: {
    roomId: v.union(
      v.id('commissionersVotersRooms'),
      v.id('adminCommissionersRooms'),
    ),
    side: v.union(v.literal('voter'), v.literal('admin')),
  },
  handler: async (ctx, { roomId, side }) => {
    if (side === 'voter') {
      const room = await ctx.db.get(roomId as Id<'commissionersVotersRooms'>);
      if (!room || room.deletedAt) return [];
      await assertBoostForVoterChat(ctx, room.electionId);
      await assertVoterRoomAccess(ctx, room);
      const messages = await ctx.db
        .query('commissionersVotersMessages')
        .withIndex('by_room', (q) => q.eq('roomId', room._id))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect();
      return await attachUserName(ctx, messages);
    }
    const room = await ctx.db.get(roomId as Id<'adminCommissionersRooms'>);
    if (!room || room.deletedAt) return [];
    await requireCommissioner(ctx, room.electionId);
    const messages = await ctx.db
      .query('adminCommissionersMessages')
      .withIndex('by_room', (q) => q.eq('roomId', room._id))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    return await attachUserName(ctx, messages);
  },
});

export const sendMessage = mutation({
  args: {
    roomId: v.union(
      v.id('commissionersVotersRooms'),
      v.id('adminCommissionersRooms'),
    ),
    side: v.union(v.literal('voter'), v.literal('admin')),
    message: v.string(),
  },
  handler: async (ctx, { roomId, side, message }) => {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Empty message',
      });
    }
    if (trimmed.length > 4000) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Message too long',
      });
    }
    const userId = await requireUser(ctx);

    if (side === 'voter') {
      const room = await ctx.db.get(roomId as Id<'commissionersVotersRooms'>);
      if (!room || room.deletedAt) {
        throw new ConvexError({ code: 'not_found', message: 'Room not found' });
      }
      await assertBoostForVoterChat(ctx, room.electionId);
      await assertVoterRoomAccess(ctx, room);
      await ctx.db.insert('commissionersVotersMessages', {
        message: trimmed,
        userId,
        roomId: room._id,
      });
      return;
    }

    const room = await ctx.db.get(roomId as Id<'adminCommissionersRooms'>);
    if (!room || room.deletedAt) {
      throw new ConvexError({ code: 'not_found', message: 'Room not found' });
    }
    await requireCommissioner(ctx, room.electionId);
    await ctx.db.insert('adminCommissionersMessages', {
      message: trimmed,
      userId,
      roomId: room._id,
    });
  },
});

/* ------------------------------------------------------------------ */
/* helpers                                                              */
/* ------------------------------------------------------------------ */

async function voterForUser(
  ctx: { db: { query: typeof query extends never ? never : any } } & Parameters<
    typeof requireUser
  >[0],
  electionId: Id<'elections'>,
  email: string,
) {
  return await ctx.db
    .query('voters')
    .withIndex('by_election_email', (q: any) =>
      q.eq('electionId', electionId).eq('email', email),
    )
    .filter((q: any) => q.eq(q.field('deletedAt'), undefined))
    .first();
}

async function assertVoterRoomAccess(
  ctx: Parameters<typeof requireUser>[0],
  room: Doc<'commissionersVotersRooms'>,
) {
  const userId = await requireUser(ctx);
  const commissioner = await ctx.db
    .query('commissioners')
    .withIndex('by_user_election', (q) =>
      q.eq('userId', userId).eq('electionId', room.electionId),
    )
    .filter((q) => q.eq(q.field('deletedAt'), undefined))
    .first();
  if (commissioner) return;
  if (!room.voterId) {
    throw new ConvexError({ code: 'forbidden', message: 'Access denied' });
  }
  const user = await ctx.db.get(userId);
  if (!user?.email) {
    throw new ConvexError({ code: 'forbidden', message: 'Access denied' });
  }
  const voter = await ctx.db.get(room.voterId);
  if (!voter || voter.email !== user.email) {
    throw new ConvexError({ code: 'forbidden', message: 'Access denied' });
  }
}

async function attachUserName<T extends { userId: Id<'users'> }>(
  ctx: Parameters<typeof requireUser>[0],
  messages: T[],
) {
  const ids = Array.from(new Set(messages.map((m) => m.userId)));
  const users = await Promise.all(ids.map((id) => ctx.db.get(id)));
  const byId = new Map(
    users
      .filter((u): u is NonNullable<typeof u> => u !== null)
      .map((u) => [u._id, u]),
  );
  return messages.map((m) => ({
    ...m,
    authorName: byId.get(m.userId)?.name ?? byId.get(m.userId)?.email ?? null,
    authorEmail: byId.get(m.userId)?.email ?? null,
  }));
}
