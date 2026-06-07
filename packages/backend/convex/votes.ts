import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { query } from './_generated/server';
import { isVotingOpen } from './_helpers/election_timing';
import { enforceRateLimit } from './_helpers/rateLimit';
import { mutation } from './_helpers/triggers';

/**
 * Loads everything the ballot UI needs in one query: election timing/meta,
 * positions (ordered) with their candidates, the voter's record, and a
 * `hasVoted` flag. Throws when the election isn't ongoing or the caller
 * isn't a registered voter.
 */
export const getVotingPage = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: 'unauthorized',
        message: 'Sign in to vote',
      });
    }
    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new ConvexError({
        code: 'unauthorized',
        message: 'Account email is required to vote',
      });
    }

    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (!election) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Election not found',
      });
    }

    if (!isVotingOpen(election)) {
      throw new ConvexError({
        code: 'voting_closed',
        message: 'Voting is not open for this election',
      });
    }

    const voter = await ctx.db
      .query('voters')
      .withIndex('by_election_email', (q) =>
        q.eq('electionId', election._id).eq('email', user.email!),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();

    if (!voter) {
      throw new ConvexError({
        code: 'forbidden',
        message: 'You are not a registered voter for this election',
      });
    }

    const existingVote = await ctx.db
      .query('votes')
      .withIndex('by_election_voter', (q) =>
        q.eq('electionId', election._id).eq('voterId', voter._id),
      )
      .first();

    const [positions, candidates, partylists, voterFields] = await Promise.all([
      ctx.db
        .query('positions')
        .withIndex('by_deleted_election', (q) =>
          q.eq('deletedAt', undefined).eq('electionId', election._id),
        )
        .collect(),
      ctx.db
        .query('candidates')
        .withIndex('by_election', (q) => q.eq('electionId', election._id))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('partylists')
        .withIndex('by_deleted_election', (q) =>
          q.eq('deletedAt', undefined).eq('electionId', election._id),
        )
        .collect(),
      ctx.db
        .query('voterFields')
        .withIndex('by_election', (q) => q.eq('electionId', election._id))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
    ]);

    const partylistsById = new Map(partylists.map((p) => [p._id, p]));
    const candidatesWithImages = await Promise.all(
      candidates.map(async (c) => ({
        ...c,
        imageUrl: c.imageStorageId
          ? await ctx.storage.getUrl(c.imageStorageId)
          : null,
        partylistAcronym: partylistsById.get(c.partylistId)?.acronym ?? '',
      })),
    );

    return {
      election: {
        _id: election._id,
        name: election.name,
        slug: election.slug,
        nameArrangement: election.nameArrangement,
        startDate: election.startDate,
        endDate: election.endDate,
        votingHourStart: election.votingHourStart,
        votingHourEnd: election.votingHourEnd,
      },
      voter: { _id: voter._id, field: voter.field },
      voterFields,
      missingVoterFields: getMissingVoterFields(voterFields, voter.field),
      hasVoted: Boolean(existingVote),
      positions: positions
        .sort((a, b) => a.order - b.order)
        .map((p) => ({
          ...p,
          candidates: candidatesWithImages.filter(
            (c) => c.positionId === p._id,
          ),
        })),
    };
  },
});

/**
 * Names of the election's custom voter fields that the voter hasn't filled in
 * yet. A field counts as missing when there's no value or only whitespace.
 * `field` is the voter's stored answer blob (`Record<fieldName, value>`).
 */
function getMissingVoterFields(
  voterFields: { name: string }[],
  field: unknown,
): string[] {
  const values = (field as Record<string, string> | undefined) ?? {};
  return voterFields
    .filter((f) => {
      const value = values[f.name];
      return value === undefined || value.trim() === '';
    })
    .map((f) => f.name);
}

/**
 * Lets a registered voter fill in (or update) their own custom voter-field
 * answers for an election — the voting page prompts for these before showing
 * the ballot when any required field is missing. Only the election's defined
 * fields are stored; every one must be non-empty.
 */
export const submitVoterFields = mutation({
  args: {
    electionId: v.id('elections'),
    fields: v.record(v.string(), v.string()),
  },
  handler: async (ctx, { electionId, fields }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: 'unauthorized',
        message: 'Sign in to vote',
      });
    }
    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new ConvexError({
        code: 'unauthorized',
        message: 'Account email is required to vote',
      });
    }

    const election = await ctx.db.get(electionId);
    if (!election || election.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Election not found',
      });
    }

    const voter = await ctx.db
      .query('voters')
      .withIndex('by_election_email', (q) =>
        q.eq('electionId', election._id).eq('email', user.email!),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (!voter) {
      throw new ConvexError({
        code: 'forbidden',
        message: 'You are not a registered voter for this election',
      });
    }

    const voterFields = await ctx.db
      .query('voterFields')
      .withIndex('by_election', (q) => q.eq('electionId', election._id))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();

    // Build the stored blob only from the election's defined fields (ignore
    // any extra keys) and require every one to be non-empty.
    const merged: Record<string, string> = {
      ...((voter.field as Record<string, string> | undefined) ?? {}),
    };
    const missing: string[] = [];
    for (const vf of voterFields) {
      const value = fields[vf.name]?.trim() ?? '';
      if (!value) {
        missing.push(vf.name);
        continue;
      }
      merged[vf.name] = value;
    }
    if (missing.length > 0) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: `Please fill in all fields: ${missing.join(', ')}`,
      });
    }

    await ctx.db.patch(voter._id, { field: merged });
    return { ok: true as const };
  },
});

/**
 * Casts a ballot atomically. The whole mutation runs in a single Convex
 * transaction — partial writes don't leak.
 *
 * Validations:
 *   - voter exists for this election and email matches the auth user
 *   - hasn't already voted (one ballot per voter)
 *   - election is currently ongoing (date + hour window)
 *   - each position's selection count is within [min, max]
 *   - candidates belong to the position they're cast for
 *   - abstain rows store positionId, candidateId is undefined
 *   - candidate-vote rows store candidateId, positionId is undefined
 *     (matches the shape the original Postgres impl wrote)
 */
export const cast = mutation({
  args: {
    electionId: v.id('elections'),
    selections: v.array(
      v.object({
        positionId: v.id('positions'),
        choice: v.union(
          v.object({ kind: v.literal('abstain') }),
          v.object({
            kind: v.literal('candidates'),
            candidateIds: v.array(v.id('candidates')),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, { electionId, selections }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: 'unauthorized',
        message: 'Sign in to vote',
      });
    }
    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new ConvexError({
        code: 'unauthorized',
        message: 'Account email is required to vote',
      });
    }

    // Cap ballot-submission attempts per user to absorb script-driven retries.
    // One ballot per election is enforced below — this protects the rest of
    // the validation pipeline from getting hammered.
    await enforceRateLimit(ctx, {
      key: `vote:${userId}`,
      limit: 10,
      windowMs: 60_000,
      message: 'Too many ballot submissions — try again in a minute.',
    });

    const election = await ctx.db.get(electionId);
    if (!election || election.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Election not found',
      });
    }

    if (!isVotingOpen(election)) {
      throw new ConvexError({
        code: 'forbidden',
        message: 'Voting is not open for this election',
      });
    }

    const voter = await ctx.db
      .query('voters')
      .withIndex('by_election_email', (q) =>
        q.eq('electionId', election._id).eq('email', user.email!),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();

    if (!voter) {
      throw new ConvexError({
        code: 'forbidden',
        message: 'You are not a registered voter for this election',
      });
    }

    const existingVote = await ctx.db
      .query('votes')
      .withIndex('by_election_voter', (q) =>
        q.eq('electionId', election._id).eq('voterId', voter._id),
      )
      .first();
    if (existingVote) {
      throw new ConvexError({
        code: 'conflict',
        message: 'You have already voted in this election',
      });
    }

    // Require the voter's custom fields to be filled before accepting a ballot.
    // The voting page collects these up front, but enforce server-side too so
    // the requirement can't be bypassed.
    const voterFields = await ctx.db
      .query('voterFields')
      .withIndex('by_election', (q) => q.eq('electionId', election._id))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    const missingVoterFields = getMissingVoterFields(voterFields, voter.field);
    if (missingVoterFields.length > 0) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: `Please complete your voter information first: ${missingVoterFields.join(', ')}`,
      });
    }

    const positions = await ctx.db
      .query('positions')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', election._id),
      )
      .collect();
    const positionsById = new Map(positions.map((p) => [p._id, p]));

    const seenPositions = new Set<Id<'positions'>>();
    for (const sel of selections) {
      const pos = positionsById.get(sel.positionId);
      if (!pos) {
        throw new ConvexError({
          code: 'invalid_argument',
          message: 'Unknown position in ballot',
        });
      }
      if (seenPositions.has(sel.positionId)) {
        throw new ConvexError({
          code: 'invalid_argument',
          message: 'Duplicate position in ballot',
        });
      }
      seenPositions.add(sel.positionId);

      if (sel.choice.kind === 'candidates') {
        const count = sel.choice.candidateIds.length;
        // An empty candidate list is not a valid vote — to select no one the
        // voter must explicitly abstain. This blocks "blank" ballots that
        // neither pick a candidate nor abstain (possible when pos.min === 0).
        if (count === 0) {
          throw new ConvexError({
            code: 'invalid_argument',
            message: `Select at least one candidate for ${pos.name}, or choose to abstain`,
          });
        }
        if (count < pos.min || count > pos.max) {
          throw new ConvexError({
            code: 'invalid_argument',
            message: `Pick between ${pos.min} and ${pos.max} candidates for ${pos.name}`,
          });
        }
        // Verify each candidate belongs to this position + election.
        for (const cid of sel.choice.candidateIds) {
          const c = await ctx.db.get(cid);
          if (
            !c ||
            c.deletedAt ||
            c.electionId !== election._id ||
            c.positionId !== sel.positionId
          ) {
            throw new ConvexError({
              code: 'invalid_argument',
              message: `Invalid candidate for ${pos.name}`,
            });
          }
        }
      } else {
        // abstain
        if (pos.min > 0) {
          throw new ConvexError({
            code: 'invalid_argument',
            message: `Abstain not allowed for ${pos.name}`,
          });
        }
      }
    }

    // All positions must be answered.
    for (const pos of positions) {
      if (!seenPositions.has(pos._id)) {
        throw new ConvexError({
          code: 'invalid_argument',
          message: `Missing selection for ${pos.name}`,
        });
      }
    }

    // Insert vote rows.
    for (const sel of selections) {
      if (sel.choice.kind === 'abstain') {
        await ctx.db.insert('votes', {
          electionId: election._id,
          voterId: voter._id,
          positionId: sel.positionId,
        });
      } else {
        for (const candidateId of sel.choice.candidateIds) {
          await ctx.db.insert('votes', {
            electionId: election._id,
            voterId: voter._id,
            candidateId,
          });
        }
      }
    }

    // Denormalize: mark voter as voted. The trigger on `voters` (see
    // _helpers/triggers.ts) will add this voter to the voted-voters aggregate
    // so the dashboard counts stay O(log n).
    if (!voter.votedAt) {
      await ctx.db.patch(voter._id, { votedAt: Date.now() });
    }

    // Confirmation email goes out asynchronously so the mutation stays fast
    // (and a SES outage can't fail the ballot insert). Convex retries the
    // action on transient errors.
    await ctx.scheduler.runAfter(0, internal.voterBlast.sendVoteReceipt, {
      electionId: election._id,
      voterEmail: user.email,
    });

    return { ok: true as const };
  },
});

/** Returns the current voter's ballot for this election, if any. */
export const myBallot = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user?.email) return null;

    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (!election) return null;

    const voter = await ctx.db
      .query('voters')
      .withIndex('by_election_email', (q) =>
        q.eq('electionId', election._id).eq('email', user.email!),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (!voter) return null;

    const votes = await ctx.db
      .query('votes')
      .withIndex('by_election_voter', (q) =>
        q.eq('electionId', election._id).eq('voterId', voter._id),
      )
      .collect();
    if (votes.length === 0) return null;

    const positions = await ctx.db
      .query('positions')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', election._id),
      )
      .collect();

    const candidates = await ctx.db
      .query('candidates')
      .withIndex('by_election', (q) => q.eq('electionId', election._id))
      .collect();
    const candidatesById = new Map(candidates.map((c) => [c._id, c]));

    const partylists = await ctx.db
      .query('partylists')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', election._id),
      )
      .collect();
    const partylistsById = new Map(partylists.map((p) => [p._id, p]));

    return positions
      .sort((a, b) => a.order - b.order)
      .map((position) => {
        const candidateVotes = votes
          .map((v) =>
            v.candidateId ? candidatesById.get(v.candidateId) : undefined,
          )
          .filter(
            (c): c is NonNullable<typeof c> =>
              !!c && c.positionId === position._id,
          );
        const isAbstain = votes.some(
          (v) => v.positionId === position._id && !v.candidateId,
        );
        return {
          id: position._id,
          name: position.name,
          isAbstain,
          candidates: candidateVotes.map((c) => ({
            id: c._id,
            firstName: c.firstName,
            middleName: c.middleName,
            lastName: c.lastName,
            partylistAcronym: partylistsById.get(c.partylistId)?.acronym ?? '',
          })),
        };
      });
  },
});
