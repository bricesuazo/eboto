import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import type { Infer } from 'convex/values';
import { v } from 'convex/values';

const publicity = v.union(
  v.literal('PRIVATE'),
  v.literal('VOTER'),
  v.literal('PUBLIC'),
);

export const voterFieldType = v.union(
  v.literal('text'),
  v.literal('number'),
  v.literal('boolean'),
  v.literal('date'),
);
export type VoterFieldType = Infer<typeof voterFieldType>;

export const voterNotificationPhase = v.union(
  v.literal('start'),
  v.literal('end'),
);
export type VoterNotificationPhase = Infer<typeof voterNotificationPhase>;

export default defineSchema({
  // ---- Convex Auth tables (users, accounts, sessions, …) ----
  // The default `users` table from authTables is extended below.
  ...authTables,

  // Profile fields layered on top of the auth `users` table.
  // (authTables already provides id, email, name, image, emailVerificationTime.)
  userProfiles: defineTable({
    userId: v.id('users'),
    name: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    deletedAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  // ---- Domain tables ----

  elections: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    votingHourStart: v.number(),
    votingHourEnd: v.number(),
    // IANA timezone (e.g. "Asia/Manila") that the calendar dates and voting
    // hours are interpreted in. Defaults to the election creator's timezone,
    // falling back to Philippine time. Optional for backward compatibility
    // with rows created before this field existed — timing helpers treat an
    // absent value as "Asia/Manila".
    timezone: v.optional(v.string()),
    publicity,
    logoStorageId: v.optional(v.id('_storage')),
    voterDomain: v.optional(v.string()),
    isCandidatesVisibleInRealtimeWhenOngoing: v.boolean(),
    nameArrangement: v.number(),
    variantId: v.number(),
    // Optional voter cap for paid (Boost) elections. Free elections leave this
    // undefined and fall back to the constant FREE_TIER_VOTER_CAP. -1 means
    // unlimited (custom contact-us tier).
    voterCap: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index('by_slug', ['slug'])
    .index('by_deleted_slug', ['deletedAt', 'slug']),

  electionsPlus: defineTable({
    userId: v.id('users'),
    redeemedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  commissioners: defineTable({
    userId: v.id('users'),
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  })
    .index('by_election', ['electionId'])
    .index('by_user', ['userId'])
    .index('by_user_election', ['userId', 'electionId']),

  // Outstanding "you've been added as a commissioner" invites. Every add
  // routes through this table — the invitee must explicitly accept (which
  // consumes one of *their* Plus credits, or their first free slot) or
  // decline. Inviters can cancel an unaccepted invite via `deletedAt`.
  commissionerInvites: defineTable({
    electionId: v.id('elections'),
    email: v.string(),
    invitedByUserId: v.id('users'),
    acceptedAt: v.optional(v.number()),
    declinedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index('by_election', ['electionId'])
    .index('by_email', ['email'])
    .index('by_election_email', ['electionId', 'email']),

  partylists: defineTable({
    name: v.string(),
    acronym: v.string(),
    description: v.optional(v.string()),
    logoStorageId: v.optional(v.id('_storage')),
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  })
    .index('by_election', ['electionId'])
    .index('by_deleted_election', ['deletedAt', 'electionId']),

  positions: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    min: v.number(),
    max: v.number(),
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  })
    .index('by_election', ['electionId'])
    .index('by_deleted_election', ['deletedAt', 'electionId']),

  credentials: defineTable({
    deletedAt: v.optional(v.number()),
  }),

  candidates: defineTable({
    slug: v.string(),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    imageStorageId: v.optional(v.id('_storage')),
    electionId: v.id('elections'),
    credentialId: v.id('credentials'),
    positionId: v.id('positions'),
    partylistId: v.id('partylists'),
    deletedAt: v.optional(v.number()),
  })
    .index('by_election', ['electionId'])
    .index('by_position', ['positionId'])
    .index('by_partylist', ['partylistId'])
    .index('by_election_slug', ['electionId', 'slug']),

  achievements: defineTable({
    name: v.string(),
    year: v.string(),
    credentialId: v.id('credentials'),
    deletedAt: v.optional(v.number()),
  }).index('by_credential', ['credentialId']),

  affiliations: defineTable({
    orgName: v.string(),
    orgPosition: v.string(),
    startYear: v.string(),
    endYear: v.optional(v.string()),
    credentialId: v.id('credentials'),
    deletedAt: v.optional(v.number()),
  }).index('by_credential', ['credentialId']),

  eventsAttended: defineTable({
    name: v.string(),
    year: v.string(),
    credentialId: v.id('credentials'),
    deletedAt: v.optional(v.number()),
  }).index('by_credential', ['credentialId']),

  platforms: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    candidateId: v.id('candidates'),
    deletedAt: v.optional(v.number()),
  }).index('by_candidate', ['candidateId']),

  voterFields: defineTable({
    name: v.string(),
    type: voterFieldType,
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  }).index('by_election', ['electionId']),

  voters: defineTable({
    email: v.string(),
    field: v.optional(v.any()),
    electionId: v.id('elections'),
    votedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index('by_election', ['electionId'])
    .index('by_email', ['email'])
    .index('by_election_email', ['electionId', 'email'])
    .index('by_election_voted', ['electionId', 'votedAt'])
    .searchIndex('search_email', {
      searchField: 'email',
      filterFields: ['electionId', 'deletedAt'],
    }),

  // Records every "election started"/"election ended" email we've handed to
  // the email provider for a given voter. The `by_election_voter_phase`
  // index doubles as an idempotency guard: the Inngest sender does a
  // first-write-wins insert keyed on (electionId, voterId, phase) so a
  // re-emit of the lifecycle event won't double-send.
  voterNotifications: defineTable({
    electionId: v.id('elections'),
    voterId: v.id('voters'),
    phase: voterNotificationPhase,
    status: v.union(v.literal('sent'), v.literal('failed')),
    providerId: v.optional(v.string()),
    error: v.optional(v.string()),
    sentAt: v.number(),
  })
    .index('by_election_phase', ['electionId', 'phase'])
    .index('by_election_voter_phase', ['electionId', 'voterId', 'phase']),

  votes: defineTable({
    voterId: v.id('voters'),
    candidateId: v.optional(v.id('candidates')),
    positionId: v.optional(v.id('positions')),
    electionId: v.id('elections'),
  })
    .index('by_election_voter', ['electionId', 'voterId'])
    .index('by_candidate', ['candidateId'])
    .index('by_position', ['positionId']),

  generatedElectionResults: defineTable({
    electionId: v.id('elections'),
    result: v.any(),
    deletedAt: v.optional(v.number()),
  }).index('by_election', ['electionId']),

  reportedProblems: defineTable({
    subject: v.string(),
    description: v.string(),
    electionId: v.optional(v.id('elections')),
    userId: v.id('users'),
    deletedAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  // ---- Chat (kept as-is from schema; not yet wired into UI) ----
  adminCommissionersRooms: defineTable({
    name: v.string(),
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  }).index('by_election', ['electionId']),

  adminCommissionersMessages: defineTable({
    message: v.string(),
    userId: v.id('users'),
    roomId: v.id('adminCommissionersRooms'),
    deletedAt: v.optional(v.number()),
  }).index('by_room', ['roomId']),

  commissionersVotersRooms: defineTable({
    name: v.string(),
    voterId: v.optional(v.id('voters')),
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  })
    .index('by_election', ['electionId'])
    .index('by_election_voter', ['electionId', 'voterId']),

  commissionersVotersMessages: defineTable({
    message: v.string(),
    userId: v.id('users'),
    roomId: v.id('commissionersVotersRooms'),
    deletedAt: v.optional(v.number()),
  }).index('by_room', ['roomId']),

  // ---- Rate limiting ----
  // Sliding-window counter keyed on `{action}:{subject}` (e.g.
  // `vote:user_abc`). Each mutation that wants to rate-limit calls
  // `enforceRateLimit(ctx, ...)` which upserts into this table inside the
  // same transaction.
  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index('by_key', ['key']),

  // ---- Billing reference data ----
  products: defineTable({
    name: v.string(),
    lemonId: v.number(),
  }).index('by_lemon', ['lemonId']),

  variants: defineTable({
    name: v.string(),
    price: v.number(),
    productId: v.id('products'),
    lemonId: v.number(),
  })
    .index('by_lemon', ['lemonId'])
    .index('by_product', ['productId']),
});
