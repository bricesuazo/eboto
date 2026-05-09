import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireCommissioner } from './_helpers/auth';

export const list = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const voters = await ctx.db
      .query('voters')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();

    const electionVotes = await ctx.db
      .query('votes')
      .withIndex('by_election_voter', (q) => q.eq('electionId', electionId))
      .collect();
    const votedSet = new Set(electionVotes.map((v) => v.voterId));

    return voters.map((v) => ({
      ...v,
      hasVoted: votedSet.has(v._id),
    }));
  },
});

export const create = mutation({
  args: {
    electionId: v.id('elections'),
    email: v.string(),
  },
  handler: async (ctx, { electionId, email }) => {
    await requireCommissioner(ctx, electionId);
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Email required',
      });
    }
    const conflict = await ctx.db
      .query('voters')
      .withIndex('by_election_email', (q) =>
        q.eq('electionId', electionId).eq('email', normalized),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (conflict) {
      throw new ConvexError({
        code: 'conflict',
        message: 'That voter is already registered.',
      });
    }
    return await ctx.db.insert('voters', { electionId, email: normalized });
  },
});

export const bulkCreate = mutation({
  args: {
    electionId: v.id('elections'),
    emails: v.array(v.string()),
  },
  handler: async (ctx, { electionId, emails }) => {
    await requireCommissioner(ctx, electionId);
    const existing = await ctx.db
      .query('voters')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    const have = new Set(existing.map((v) => v.email));

    let added = 0;
    const skipped: string[] = [];
    for (const raw of emails) {
      const email = raw.trim().toLowerCase();
      if (!email) continue;
      if (have.has(email)) {
        skipped.push(email);
        continue;
      }
      await ctx.db.insert('voters', { electionId, email });
      have.add(email);
      added++;
    }

    return { added, skipped };
  },
});

export const softDelete = mutation({
  args: { id: v.id('voters') },
  handler: async (ctx, { id }) => {
    const voter = await ctx.db.get(id);
    if (!voter || voter.deletedAt) {
      throw new ConvexError({ code: 'not_found', message: 'Voter not found' });
    }
    await requireCommissioner(ctx, voter.electionId);
    await ctx.db.patch(id, { deletedAt: Date.now() });
  },
});
