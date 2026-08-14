import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  loadElectionForEdit,
  requireBeforeVotingOpens,
  requireChangeReason,
  requireCommissioner,
} from './_helpers/auth';
import type { FieldChange, FieldSpec } from './_helpers/changeLog';
import {
  candidateLabel,
  diffFields,
  fieldChange,
  recordElectionChange,
} from './_helpers/changeLog';

/**
 * Returns `null` when the election or candidate doesn't exist. Routes treat
 * `null` as a 404 — keeping it out of `ConvexError` means we don't pollute
 * the deployment logs with every bad-slug navigation.
 */
export const getBySlug = query({
  args: {
    electionSlug: v.string(),
    candidateSlug: v.string(),
  },
  handler: async (ctx, { electionSlug, candidateSlug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', electionSlug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();

    if (!election) return null;

    const candidate = await ctx.db
      .query('candidates')
      .withIndex('by_election_slug', (q) =>
        q.eq('electionId', election._id).eq('slug', candidateSlug),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();

    if (!candidate) return null;

    const [
      position,
      partylist,
      platforms,
      achievements,
      affiliations,
      eventsAttended,
      imageUrl,
      electionLogoUrl,
    ] = await Promise.all([
      ctx.db.get(candidate.positionId),
      ctx.db.get(candidate.partylistId),
      ctx.db
        .query('platforms')
        .withIndex('by_candidate', (q) => q.eq('candidateId', candidate._id))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('achievements')
        .withIndex('by_credential', (q) =>
          q.eq('credentialId', candidate.credentialId),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('affiliations')
        .withIndex('by_credential', (q) =>
          q.eq('credentialId', candidate.credentialId),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('eventsAttended')
        .withIndex('by_credential', (q) =>
          q.eq('credentialId', candidate.credentialId),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      candidate.imageStorageId
        ? ctx.storage.getUrl(candidate.imageStorageId)
        : Promise.resolve(null),
      election.logoStorageId
        ? ctx.storage.getUrl(election.logoStorageId)
        : Promise.resolve(null),
    ]);

    return {
      election: { ...election, logoUrl: electionLogoUrl },
      candidate: {
        ...candidate,
        imageUrl,
        position,
        partylist,
        platforms,
        credentials: { achievements, affiliations, eventsAttended },
      },
    };
  },
});

export const list = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const candidates = await ctx.db
      .query('candidates')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    const partylists = await ctx.db
      .query('partylists')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', electionId),
      )
      .collect();
    const positions = await ctx.db
      .query('positions')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', electionId),
      )
      .collect();

    const partylistsById = new Map(partylists.map((p) => [p._id, p]));
    const positionsById = new Map(positions.map((p) => [p._id, p]));

    return await Promise.all(
      candidates.map(async (c) => ({
        ...c,
        imageUrl: c.imageStorageId
          ? await ctx.storage.getUrl(c.imageStorageId)
          : null,
        partylist: partylistsById.get(c.partylistId) ?? null,
        position: positionsById.get(c.positionId) ?? null,
      })),
    );
  },
});

export const create = mutation({
  args: {
    electionId: v.id('elections'),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    slug: v.string(),
    positionId: v.id('positions'),
    partylistId: v.id('partylists'),
    imageStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx, args.electionId);
    // Hard lock: a candidate added after voting opens cannot be chosen by
    // anyone who already cast a ballot.
    await requireBeforeVotingOpens(
      ctx,
      args.electionId,
      'adding a new candidate',
    );

    const slug = args.slug.trim().toLowerCase();
    if (!slug) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Slug required',
      });
    }
    const conflict = await ctx.db
      .query('candidates')
      .withIndex('by_election_slug', (q) =>
        q.eq('electionId', args.electionId).eq('slug', slug),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (conflict) {
      throw new ConvexError({
        code: 'conflict',
        message: 'A candidate with that slug already exists.',
      });
    }

    // Each candidate has its own credentials row.
    const credentialId = await ctx.db.insert('credentials', {});

    return await ctx.db.insert('candidates', {
      slug,
      firstName: args.firstName.trim(),
      middleName: args.middleName?.trim() ?? undefined,
      lastName: args.lastName.trim(),
      electionId: args.electionId,
      positionId: args.positionId,
      partylistId: args.partylistId,
      credentialId,
      imageStorageId: args.imageStorageId,
    });
  },
});

/**
 * Candidate fields that stay editable after voting opens. Correcting a
 * misspelled name here is the single most common reason a commissioner needs
 * to touch a live election.
 */
const CANDIDATE_LOGGED_FIELDS: FieldSpec[] = [
  { key: 'firstName', label: 'First name' },
  { key: 'middleName', label: 'Middle name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'slug', label: 'Profile URL' },
];

export const update = mutation({
  args: {
    id: v.id('candidates'),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    slug: v.string(),
    positionId: v.id('positions'),
    partylistId: v.id('partylists'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.id);
    if (!candidate || candidate.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Candidate not found',
      });
    }
    const { userId } = await requireCommissioner(ctx, candidate.electionId);
    const { votingStarted } = await loadElectionForEdit(
      ctx,
      candidate.electionId,
    );

    const slug = args.slug.trim().toLowerCase();
    if (slug !== candidate.slug) {
      const conflict = await ctx.db
        .query('candidates')
        .withIndex('by_election_slug', (q) =>
          q.eq('electionId', candidate.electionId).eq('slug', slug),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      if (conflict) {
        throw new ConvexError({
          code: 'conflict',
          message: 'A candidate with that slug already exists.',
        });
      }
    }

    // Moving a candidate between races or parties rewrites what a cast
    // ballot means, so both are locked once voting opens.
    if (votingStarted) {
      const locked: string[] = [];
      if (args.positionId !== candidate.positionId) locked.push('position');
      if (args.partylistId !== candidate.partylistId) locked.push('partylist');
      if (locked.length > 0) {
        throw new ConvexError({
          code: 'forbidden',
          message: `Voting has started, so a candidate's ${locked.join(' and ')} can no longer change — votes already cast were recorded against the current one. Names and photos are still editable.`,
        });
      }
    }

    const patch = {
      slug,
      firstName: args.firstName.trim(),
      middleName: args.middleName?.trim() ?? undefined,
      lastName: args.lastName.trim(),
      positionId: args.positionId,
      partylistId: args.partylistId,
    };
    const changes = votingStarted
      ? diffFields(candidate, patch, CANDIDATE_LOGGED_FIELDS)
      : [];
    const reason = requireChangeReason(args.reason, changes.length > 0);

    await ctx.db.patch(args.id, patch);

    if (changes.length > 0) {
      await recordElectionChange(ctx, {
        electionId: candidate.electionId,
        actorUserId: userId,
        entity: 'candidate',
        entityId: args.id,
        // Label with the pre-edit name so an entry that renames someone
        // still says who it was about.
        entityLabel: candidateLabel(candidate),
        action: 'update',
        changes,
        reason,
      });
    }
  },
});

export const softDelete = mutation({
  args: { id: v.id('candidates') },
  handler: async (ctx, { id }) => {
    const candidate = await ctx.db.get(id);
    if (!candidate || candidate.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Candidate not found',
      });
    }
    await requireCommissioner(ctx, candidate.electionId);
    // Hard lock: removing a candidate discards the votes already cast for
    // them.
    await requireBeforeVotingOpens(
      ctx,
      candidate.electionId,
      'removing a candidate',
    );
    await ctx.db.patch(id, { deletedAt: Date.now() });
  },
});

/** Loads platforms + all credential rows for the dashboard editor. */
export const getCredentials = query({
  args: { candidateId: v.id('candidates') },
  handler: async (ctx, { candidateId }) => {
    const candidate = await ctx.db.get(candidateId);
    if (!candidate || candidate.deletedAt) return null;
    await requireCommissioner(ctx, candidate.electionId);
    const credentialId = candidate.credentialId;
    const [platforms, achievements, affiliations, eventsAttended] =
      await Promise.all([
        ctx.db
          .query('platforms')
          .withIndex('by_candidate', (q) => q.eq('candidateId', candidateId))
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .collect(),
        ctx.db
          .query('achievements')
          .withIndex('by_credential', (q) => q.eq('credentialId', credentialId))
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .collect(),
        ctx.db
          .query('affiliations')
          .withIndex('by_credential', (q) => q.eq('credentialId', credentialId))
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .collect(),
        ctx.db
          .query('eventsAttended')
          .withIndex('by_credential', (q) => q.eq('credentialId', credentialId))
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .collect(),
      ]);
    return {
      platforms: platforms.map((p) => ({
        title: p.title,
        description: p.description ?? '',
      })),
      achievements: achievements.map((a) => ({ name: a.name, year: a.year })),
      affiliations: affiliations.map((a) => ({
        orgName: a.orgName,
        orgPosition: a.orgPosition,
        startYear: a.startYear,
        // The DB stores ongoing affiliations as `undefined`; the form's
        // year input expects a string, so coerce here.
        endYear: a.endYear ?? '',
      })),
      eventsAttended: eventsAttended.map((e) => ({
        name: e.name,
        year: e.year,
      })),
    };
  },
});

/**
 * Replaces a candidate's platforms + credentials in one atomic mutation.
 * The "set" semantics are intentional: rows in the request fully describe
 * the desired state, so dropped rows are deleted and unchanged rows are
 * patched. This way the dashboard can submit the entire form without
 * juggling per-row create/update/delete calls.
 */
// Year-string bounds for credential rows. Kept here (not in `_helpers/`)
// because they're cheap, self-contained, and the helper file would be a
// single 4-line export. Mirrors the frontend Zod schema at
// `apps/web/src/lib/schemas/candidate-credentials.ts`.
const CREDENTIAL_MIN_YEAR = 1900;
const CREDENTIAL_MAX_YEAR_OFFSET = 10;

function assertYearString(value: string, label: string): void {
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) {
    throw new ConvexError({
      code: 'invalid_argument',
      message: `${label} must be a 4-digit year.`,
    });
  }
  const n = Number(trimmed);
  const max = new Date().getFullYear() + CREDENTIAL_MAX_YEAR_OFFSET;
  if (n < CREDENTIAL_MIN_YEAR || n > max) {
    throw new ConvexError({
      code: 'invalid_argument',
      message: `${label} must be between ${CREDENTIAL_MIN_YEAR} and ${max}.`,
    });
  }
}

function assertOptionalEndYearString(
  value: string,
  startYear: string,
  label: string,
): void {
  const trimmed = value.trim();
  if (trimmed === '') return; // blank = ongoing affiliation
  assertYearString(trimmed, label);
  if (Number(trimmed) < Number(startYear.trim())) {
    throw new ConvexError({
      code: 'invalid_argument',
      message: `${label} must be the same as or after the start year.`,
    });
  }
}

/* --- Credential diffing -------------------------------------------------
 * Credentials are replace-all lists rather than scalar fields, so instead of
 * a per-field diff each list is rendered to one compact line and the two
 * lines are compared. That catches edits the row counts alone would miss
 * (a reworded platform, a corrected year) while keeping the log entry
 * readable by a voter rather than an auditor.
 */
const joinList = (parts: string[]) => (parts.length ? parts.join(' • ') : '—');

function platformsLine(rows: { title: string; description?: string }[]) {
  return joinList(rows.map((p) => p.title.trim()).filter(Boolean));
}
function achievementsLine(rows: { name: string; year: string }[]) {
  return joinList(
    rows
      .filter((a) => a.name.trim())
      .map((a) => `${a.name.trim()} (${a.year.trim()})`),
  );
}
function affiliationsLine(
  rows: {
    orgName: string;
    orgPosition: string;
    startYear: string;
    endYear?: string;
  }[],
) {
  return joinList(
    rows
      .filter((a) => a.orgName.trim())
      .map((a) => {
        // Blank/absent end year means the affiliation is ongoing.
        const end = a.endYear?.trim() ?? '';
        return `${a.orgPosition.trim()} at ${a.orgName.trim()} (${a.startYear.trim()}–${end === '' ? 'present' : end})`;
      }),
  );
}
function eventsLine(rows: { name: string; year: string }[]) {
  return joinList(
    rows
      .filter((e) => e.name.trim())
      .map((e) => `${e.name.trim()} (${e.year.trim()})`),
  );
}

export const updateCandidateCredentials = mutation({
  args: {
    candidateId: v.id('candidates'),
    platforms: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
      }),
    ),
    achievements: v.array(
      v.object({
        name: v.string(),
        year: v.string(),
      }),
    ),
    affiliations: v.array(
      v.object({
        orgName: v.string(),
        orgPosition: v.string(),
        startYear: v.string(),
        endYear: v.string(),
      }),
    ),
    eventsAttended: v.array(
      v.object({
        name: v.string(),
        year: v.string(),
      }),
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate || candidate.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Candidate not found',
      });
    }
    const { userId } = await requireCommissioner(ctx, candidate.electionId);
    // Credentials and platforms are informational — they describe a
    // candidate rather than define the ballot — so they stay editable.
    const { votingStarted } = await loadElectionForEdit(
      ctx,
      candidate.electionId,
    );
    const credentialId = candidate.credentialId;

    // Validate years before any writes — if anything is malformed we want
    // to reject the whole payload (we soft-delete existing rows below, so
    // a partial failure mid-loop would otherwise nuke valid credentials
    // and replace them with nothing).
    for (const a of args.achievements) {
      if (!a.name.trim()) continue;
      assertYearString(a.year, 'Achievement year');
    }
    for (const a of args.affiliations) {
      if (!a.orgName.trim()) continue;
      assertYearString(a.startYear, 'Affiliation start year');
      assertOptionalEndYearString(
        a.endYear,
        a.startYear,
        'Affiliation end year',
      );
    }
    for (const e of args.eventsAttended) {
      if (!e.name.trim()) continue;
      assertYearString(e.year, 'Event year');
    }

    // Replace-all per table — easier to reason about than diffing in JS.
    // For very long credential lists we could shift to diff-based upserts.
    const [
      existingPlatforms,
      existingAchievements,
      existingAffiliations,
      existingEvents,
    ] = await Promise.all([
      ctx.db
        .query('platforms')
        .withIndex('by_candidate', (q) => q.eq('candidateId', args.candidateId))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('achievements')
        .withIndex('by_credential', (q) => q.eq('credentialId', credentialId))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('affiliations')
        .withIndex('by_credential', (q) => q.eq('credentialId', credentialId))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('eventsAttended')
        .withIndex('by_credential', (q) => q.eq('credentialId', credentialId))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
    ]);

    // Diff before the replace-all wipes the current rows.
    const changes: FieldChange[] = votingStarted
      ? [
          ...fieldChange(
            'platforms',
            'Platforms',
            platformsLine(existingPlatforms),
            platformsLine(args.platforms),
          ),
          ...fieldChange(
            'achievements',
            'Achievements',
            achievementsLine(existingAchievements),
            achievementsLine(args.achievements),
          ),
          ...fieldChange(
            'affiliations',
            'Affiliations',
            affiliationsLine(existingAffiliations),
            affiliationsLine(args.affiliations),
          ),
          ...fieldChange(
            'eventsAttended',
            'Events attended',
            eventsLine(existingEvents),
            eventsLine(args.eventsAttended),
          ),
        ]
      : [];
    const reason = requireChangeReason(args.reason, changes.length > 0);

    const now = Date.now();
    await Promise.all([
      ...existingPlatforms.map((p) => ctx.db.patch(p._id, { deletedAt: now })),
      ...existingAchievements.map((a) =>
        ctx.db.patch(a._id, { deletedAt: now }),
      ),
      ...existingAffiliations.map((a) =>
        ctx.db.patch(a._id, { deletedAt: now }),
      ),
      ...existingEvents.map((e) => ctx.db.patch(e._id, { deletedAt: now })),
    ]);

    for (const p of args.platforms) {
      const title = p.title.trim();
      if (!title) continue;
      await ctx.db.insert('platforms', {
        title,
        description: p.description?.trim() || undefined,
        candidateId: args.candidateId,
      });
    }
    for (const a of args.achievements) {
      const name = a.name.trim();
      if (!name) continue;
      await ctx.db.insert('achievements', {
        name,
        year: a.year.trim(),
        credentialId,
      });
    }
    for (const a of args.affiliations) {
      const orgName = a.orgName.trim();
      if (!orgName) continue;
      await ctx.db.insert('affiliations', {
        orgName,
        orgPosition: a.orgPosition.trim(),
        startYear: a.startYear.trim(),
        endYear: a.endYear.trim() || undefined,
        credentialId,
      });
    }
    for (const e of args.eventsAttended) {
      const name = e.name.trim();
      if (!name) continue;
      await ctx.db.insert('eventsAttended', {
        name,
        year: e.year.trim(),
        credentialId,
      });
    }

    if (changes.length > 0) {
      await recordElectionChange(ctx, {
        electionId: candidate.electionId,
        actorUserId: userId,
        entity: 'candidate',
        entityId: args.candidateId,
        entityLabel: candidateLabel(candidate),
        action: 'update',
        changes,
        reason,
      });
    }
  },
});

/**
 * Sets the candidate's photo. Pass `null` to remove. Old blob is deleted on
 * replace. Mirrors `elections.setLogo` — presentational, so it survives the
 * start of voting and is logged instead.
 */
export const setImage = mutation({
  args: {
    id: v.id('candidates'),
    storageId: v.union(v.id('_storage'), v.null()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { id, storageId, reason: rawReason }) => {
    const candidate = await ctx.db.get(id);
    if (!candidate || candidate.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Candidate not found',
      });
    }
    const { userId } = await requireCommissioner(ctx, candidate.electionId);
    const { votingStarted } = await loadElectionForEdit(
      ctx,
      candidate.electionId,
    );

    const previous = candidate.imageStorageId;
    if (previous === (storageId ?? undefined)) return;

    const reason = requireChangeReason(rawReason, votingStarted);

    await ctx.db.patch(id, { imageStorageId: storageId ?? undefined });

    if (votingStarted) {
      await recordElectionChange(ctx, {
        electionId: candidate.electionId,
        actorUserId: userId,
        entity: 'candidate',
        entityId: id,
        entityLabel: candidateLabel(candidate),
        action: 'update',
        changes: [
          {
            field: 'photo',
            label: 'Photo',
            before: previous ? 'A photo was set' : 'No photo',
            after: storageId ? 'Replaced with a new photo' : 'No photo',
          },
        ],
        reason,
      });
    }

    if (previous && previous !== storageId) {
      try {
        await ctx.storage.delete(previous);
      } catch {
        // best-effort
      }
    }
  },
});
