import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';
import { requireCommissioner } from './_helpers/auth';
import {
  isElectionEnded,
  isElectionInProgress,
} from './_helpers/election_timing';
import {
  FREE_RESULTS_LATENCY_MS,
  freeTierResultsCutoff,
  isFreeTier,
} from './_helpers/billing';

/**
 * Live election tally. Candidates are anonymized as `Candidate N` while the
 * election is ongoing unless:
 *   - the viewer is a commissioner of this election, OR
 *   - `isCandidatesVisibleInRealtimeWhenOngoing` is true on the election.
 *
 * Convex queries are reactive; clients automatically re-render as votes land.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();

    if (!election) return null;

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    let isCommissioner = false;
    if (userId) {
      const commissioner = await ctx.db
        .query('commissioners')
        .withIndex('by_user_election', (q) =>
          q.eq('userId', userId).eq('electionId', election._id),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      isCommissioner = Boolean(commissioner);
    }

    // PRIVATE-publicity results are commissioner-only. We return `null` (the
    // same shape as a not-found election) rather than throwing, so a
    // non-commissioner who guesses the slug can't tell whether the election
    // exists.
    if (election.publicity === 'PRIVATE' && !isCommissioner) {
      return null;
    }

    // VOTER-publicity results stay restricted to registered voters (and
    // commissioners). While the election is still running, a voter must have
    // cast a ballot first — this stops peeking at live tallies before voting.
    // Once it has concluded the tally is final, so any registered voter can
    // view it whether or not they voted.
    if (election.publicity === 'VOTER' && !isCommissioner) {
      let isVoter = false;
      let hasVoted = false;
      const userEmail = user?.email;
      if (userEmail) {
        const voter = await ctx.db
          .query('voters')
          .withIndex('by_election_email', (q) =>
            q.eq('electionId', election._id).eq('email', userEmail),
          )
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .first();
        if (voter) {
          isVoter = true;
          const existingVote = await ctx.db
            .query('votes')
            .withIndex('by_election_voter', (q) =>
              q.eq('electionId', election._id).eq('voterId', voter._id),
            )
            .first();
          hasVoted = Boolean(existingVote);
        }
      }
      const ended = isElectionEnded(election);
      const allowed = ended ? isVoter : hasVoted;
      if (!allowed) {
        throw new ConvexError({
          code: 'forbidden',
          message: ended
            ? 'Only registered voters can view these results'
            : 'Cast your ballot to view results',
        });
      }
    }

    const positions = await ctx.db
      .query('positions')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', election._id),
      )
      .collect();

    const candidates = await ctx.db
      .query('candidates')
      .withIndex('by_election', (q) => q.eq('electionId', election._id))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();

    const partylists = await ctx.db
      .query('partylists')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', election._id),
      )
      .collect();
    const partylistsById = new Map(partylists.map((p) => [p._id, p] as const));

    // All votes for the election. For very large electorates we should switch
    // to an aggregate index, but materializing is fine at current scale.
    const allVotes = await ctx.db
      .query('votes')
      .withIndex('by_election_voter', (q) => q.eq('electionId', election._id))
      .collect();

    // Free-tier elections lag the live tally to the most recent elapsed hour
    // — e.g. at 8:51 AM the displayed counts only include votes whose
    // `_creationTime` is strictly before 8:00 AM. The bucket advances at the
    // top of each hour. The throttle applies to everyone including
    // commissioners so the results page is consistent across viewers.
    const free = isFreeTier(election);
    const now = Date.now();
    const cutoff = free ? freeTierResultsCutoff(now) : null;
    const eligibleVotes =
      cutoff === null
        ? allVotes
        : allVotes.filter((v) => v._creationTime < cutoff);

    const candidateVoteCounts = new Map<string, number>();
    const positionVoteCounts = new Map<string, number>();
    const positionAbstainCounts = new Map<string, number>();

    for (const vote of eligibleVotes) {
      if (vote.candidateId) {
        candidateVoteCounts.set(
          vote.candidateId,
          (candidateVoteCounts.get(vote.candidateId) ?? 0) + 1,
        );
      }
      if (vote.positionId) {
        positionVoteCounts.set(
          vote.positionId,
          (positionVoteCounts.get(vote.positionId) ?? 0) + 1,
        );
        if (!vote.candidateId) {
          positionAbstainCounts.set(
            vote.positionId,
            (positionAbstainCounts.get(vote.positionId) ?? 0) + 1,
          );
        }
      }
    }

    // Real names are revealed when: the commissioner allows realtime names,
    // OR the election has fully concluded (past the closing hour on the end
    // day — `isElectionEnded`), OR it hasn't started yet. While voting is
    // in progress (including the overnight gaps between daily voting hours)
    // anonymized candidates stay hidden if the commissioner chose to. The
    // hour-aware `isElectionEnded` check matters on the final day: once
    // voting closes, names show even though the calendar day (the date-only
    // `isElectionInProgress`) hasn't rolled over yet.
    const showRealNames =
      election.isCandidatesVisibleInRealtimeWhenOngoing ||
      isElectionEnded(election) ||
      !isElectionInProgress(election);

    return {
      election: {
        _id: election._id,
        name: election.name,
        slug: election.slug,
        startDate: election.startDate,
        endDate: election.endDate,
        votingHourStart: election.votingHourStart,
        votingHourEnd: election.votingHourEnd,
        timezone: election.timezone ?? null,
        nameArrangement: election.nameArrangement,
      },
      tier: {
        isFree: free,
        // When throttled, this is the cutoff timestamp (votes after this are
        // hidden) and the next refresh moment. Otherwise null.
        resultsCutoff: cutoff,
        nextRefreshAt:
          cutoff === null ? null : cutoff + FREE_RESULTS_LATENCY_MS,
      },
      // When true, every candidate's real name was withheld and `displayName`
      // is set to "Candidate N" instead. UI surfaces this to viewers so the
      // anonymization isn't mistaken for a data bug.
      anonymized: !showRealNames,
      positions: positions
        .sort((a, b) => a.order - b.order)
        .map((position) => {
          const positionCandidates = candidates
            .filter((c) => c.positionId === position._id)
            .map((c) => ({
              id: c._id,
              // Real name fields are emitted only when the viewer is allowed
              // to see them — otherwise the response carries no PII at all
              // and the Network tab can't be used to bypass anonymization.
              firstName: showRealNames ? c.firstName : '',
              middleName: showRealNames ? c.middleName : undefined,
              lastName: showRealNames ? c.lastName : '',
              partylistAcronym: showRealNames
                ? (partylistsById.get(c.partylistId)?.acronym ?? '')
                : '',
              votes: candidateVoteCounts.get(c._id) ?? 0,
            }))
            .sort((a, b) => b.votes - a.votes)
            .map((c, index) => ({
              ...c,
              displayName: showRealNames
                ? undefined
                : `Candidate ${index + 1}`,
            }));

          return {
            id: position._id,
            name: position.name,
            totalVotes: positionVoteCounts.get(position._id) ?? 0,
            abstainVotes: positionAbstainCounts.get(position._id) ?? 0,
            candidates: positionCandidates,
          };
        }),
    };
  },
});

/* ------------------------------------------------------------------ */
/* Turnout PDF report                                                  */
/* ------------------------------------------------------------------ */

/**
 * Internal query feeding the PDF generator. Pulls just the fields the
 * action needs — keeps the action's bundle small and avoids re-running
 * heavy logic.
 */
export const getTurnoutSnapshot = internalQuery({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    const election = await ctx.db.get(electionId);
    if (!election || election.deletedAt) return null;
    const [voters, votes] = await Promise.all([
      ctx.db
        .query('voters')
        .withIndex('by_election', (q) => q.eq('electionId', electionId))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('votes')
        .withIndex('by_election_voter', (q) => q.eq('electionId', electionId))
        .collect(),
    ]);
    const votedSet = new Set(votes.map((v) => v.voterId));
    return {
      election: {
        name: election.name,
        slug: election.slug,
        startDate: election.startDate,
        endDate: election.endDate,
      },
      voters: voters.map((v) => ({
        email: v.email,
        hasVoted: votedSet.has(v._id),
      })),
    };
  },
});

/**
 * Records a freshly generated PDF in `generatedElectionResults`. Called
 * by the action below after `ctx.storage.store()`.
 */
export const recordGeneratedResult = internalMutation({
  args: {
    electionId: v.id('elections'),
    storageId: v.id('_storage'),
    summary: v.object({
      total: v.number(),
      voted: v.number(),
      percent: v.number(),
      generatedAt: v.number(),
    }),
  },
  handler: async (ctx, { electionId, storageId, summary }) => {
    return await ctx.db.insert('generatedElectionResults', {
      electionId,
      result: { storageId, ...summary },
    });
  },
});

/**
 * Generates a turnout PDF for `electionId` and stores it in Convex storage,
 * then records the resulting row. Re-callable; previous reports are kept so
 * commissioners can compare snapshots.
 *
 * Invoked by:
 *   - Inngest `electionEnded` step right after the end-of-election email
 *     blast (`packages/inngest/src/functions/election-lifecycle.ts`).
 *   - The commissioner-facing "Generate now" dashboard button via the
 *     internal trigger below.
 */
export const generateTurnoutPdf = action({
  args: { electionId: v.id('elections') },
  handler: async (
    ctx,
    { electionId },
  ): Promise<
    | { skipped: true; reason: 'no-election' }
    | {
        skipped: false;
        reportId: Id<'generatedElectionResults'>;
        total: number;
        voted: number;
        percent: number;
      }
  > => {
    const snapshot: {
      election: {
        name: string;
        slug: string;
        startDate: number;
        endDate: number;
      };
      voters: { email: string; hasVoted: boolean }[];
    } | null = await ctx.runQuery(internal.results.getTurnoutSnapshot, {
      electionId,
    });
    if (!snapshot) return { skipped: true as const, reason: 'no-election' };

    const total = snapshot.voters.length;
    const voted = snapshot.voters.filter((v) => v.hasVoted).length;
    const percent = total === 0 ? 0 : (voted / total) * 100;
    const generatedAt = Date.now();

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 48;
    const lineHeight = 14;
    const ink = rgb(0.1, 0.12, 0.16);
    const muted = rgb(0.45, 0.48, 0.55);

    let page = pdf.addPage([pageWidth, pageHeight]);
    let cursorY = pageHeight - margin;

    const drawLine = (
      text: string,
      opts?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> },
    ) => {
      const size = opts?.size ?? 11;
      const usedFont = opts?.bold ? fontBold : font;
      if (cursorY < margin + size) {
        page = pdf.addPage([pageWidth, pageHeight]);
        cursorY = pageHeight - margin;
      }
      cursorY -= size + 2;
      page.drawText(text, {
        x: margin,
        y: cursorY,
        size,
        font: usedFont,
        color: opts?.color ?? ink,
      });
      cursorY -= 4;
    };

    drawLine('Turnout Report', { bold: true, size: 22 });
    drawLine(snapshot.election.name, { bold: true, size: 14 });
    drawLine(`/${snapshot.election.slug}`, { color: muted });
    drawLine(
      `Generated ${new Date(generatedAt).toISOString()}`,
      { color: muted, size: 9 },
    );
    cursorY -= lineHeight;

    drawLine('Summary', { bold: true, size: 13 });
    drawLine(`Eligible voters: ${total}`);
    drawLine(`Ballots cast: ${voted}`);
    drawLine(`Turnout: ${percent.toFixed(2)}%`);
    cursorY -= lineHeight;

    drawLine('Voter list', { bold: true, size: 13 });
    for (const voter of snapshot.voters) {
      drawLine(`${voter.hasVoted ? '[x]' : '[ ]'}  ${voter.email}`, {
        size: 10,
      });
    }

    const bytes = await pdf.save();
    // pdf-lib returns Uint8Array; copy into a fresh ArrayBuffer so the Blob
    // constructor's narrowed BlobPart type is satisfied (some envs widen it
    // to SharedArrayBuffer otherwise).
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const storageId = await ctx.storage.store(blob);

    const reportId: Id<'generatedElectionResults'> = await ctx.runMutation(
      internal.results.recordGeneratedResult,
      {
        electionId,
        storageId,
        summary: { total, voted, percent, generatedAt },
      },
    );

    return {
      skipped: false as const,
      reportId,
      total,
      voted,
      percent,
    };
  },
});

/**
 * Commissioner-triggered manual generation. Verifies the caller, then
 * schedules the action above. Returns immediately so the UI can show a
 * pending state without holding the request.
 */
export const triggerTurnoutPdf = action({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }): Promise<{ scheduled: true }> => {
    await ctx.runQuery(internal.results.assertCommissioner, { electionId });
    await ctx.scheduler.runAfter(0, internal.results.generateTurnoutPdfInternal, {
      electionId,
    });
    return { scheduled: true };
  },
});

export const generateTurnoutPdfInternal = internalAction({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }): Promise<void> => {
    await ctx.runAction(api.results.generateTurnoutPdf, { electionId });
  },
});

export const assertCommissioner = internalQuery({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    return null;
  },
});

/**
 * Lists generated reports for an election with download URLs. Caller must
 * be a commissioner.
 */
export const listGeneratedReports = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const rows = await ctx.db
      .query('generatedElectionResults')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .order('desc')
      .collect();
    return await Promise.all(
      rows.map(async (row) => {
        const result = row.result as {
          storageId: Id<'_storage'>;
          total: number;
          voted: number;
          percent: number;
          generatedAt: number;
        };
        const url = await ctx.storage.getUrl(result.storageId);
        return {
          _id: row._id,
          _creationTime: row._creationTime,
          url,
          summary: {
            total: result.total,
            voted: result.voted,
            percent: result.percent,
            generatedAt: result.generatedAt,
          },
        };
      }),
    );
  },
});
