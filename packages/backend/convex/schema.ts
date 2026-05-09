import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

const publicity = v.union(
  v.literal('PRIVATE'),
  v.literal('VOTER'),
  v.literal('PUBLIC'),
);

export default defineSchema({
  // ---- Convex Auth tables (users, accounts, sessions, …) ----
  // The default `users` table from authTables is extended below.
  ...authTables,

  // Profile fields layered on top of the auth `users` table.
  // (authTables already provides id, email, name, image, emailVerificationTime.)
  user_profiles: defineTable({
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
    publicity,
    logoStorageId: v.optional(v.id('_storage')),
    voterDomain: v.optional(v.string()),
    isCandidatesVisibleInRealtimeWhenOngoing: v.boolean(),
    nameArrangement: v.number(),
    variantId: v.number(),
    noOfVoters: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index('by_slug', ['slug'])
    .index('by_deleted_slug', ['deletedAt', 'slug']),

  elections_plus: defineTable({
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
    endYear: v.string(),
    credentialId: v.id('credentials'),
    deletedAt: v.optional(v.number()),
  }).index('by_credential', ['credentialId']),

  events_attended: defineTable({
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

  voter_fields: defineTable({
    name: v.string(),
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  }).index('by_election', ['electionId']),

  voters: defineTable({
    email: v.string(),
    field: v.optional(v.any()),
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  })
    .index('by_election', ['electionId'])
    .index('by_email', ['email'])
    .index('by_election_email', ['electionId', 'email']),

  votes: defineTable({
    voterId: v.id('voters'),
    candidateId: v.optional(v.id('candidates')),
    positionId: v.optional(v.id('positions')),
    electionId: v.id('elections'),
  })
    .index('by_election_voter', ['electionId', 'voterId'])
    .index('by_candidate', ['candidateId'])
    .index('by_position', ['positionId']),

  generated_election_results: defineTable({
    electionId: v.id('elections'),
    result: v.any(),
    deletedAt: v.optional(v.number()),
  }).index('by_election', ['electionId']),

  reported_problems: defineTable({
    subject: v.string(),
    description: v.string(),
    electionId: v.optional(v.id('elections')),
    userId: v.id('users'),
    deletedAt: v.optional(v.number()),
  }),

  // ---- Chat (kept as-is from schema; not yet wired into UI) ----
  admin_commissioners_rooms: defineTable({
    name: v.string(),
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  }).index('by_election', ['electionId']),

  admin_commissioners_messages: defineTable({
    message: v.string(),
    userId: v.id('users'),
    roomId: v.id('admin_commissioners_rooms'),
    deletedAt: v.optional(v.number()),
  }).index('by_room', ['roomId']),

  commissioners_voters_rooms: defineTable({
    name: v.string(),
    electionId: v.id('elections'),
    deletedAt: v.optional(v.number()),
  }).index('by_election', ['electionId']),

  commissioners_voters_messages: defineTable({
    message: v.string(),
    userId: v.id('users'),
    roomId: v.id('commissioners_voters_rooms'),
    deletedAt: v.optional(v.number()),
  }).index('by_room', ['roomId']),

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
