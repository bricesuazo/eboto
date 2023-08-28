import { relations } from "drizzle-orm";

import {
  achievements,
  affiliations,
  candidates,
  commissioners,
  credentials,
  elections,
  events_attended,
  generated_election_results,
  invited_commissioners,
  partylists,
  platforms,
  positions,
  reported_problems,
  users,
  verification_tokens,
  voter_fields,
  voters,
  votes,
} from "./schema";

export const electionsRelations = relations(elections, ({ many }) => ({
  votes: many(votes),
  positions: many(positions),
  partylists: many(partylists),
  candidates: many(candidates),
  commissioners: many(commissioners),
  voters: many(voters),
  invited_commissioners: many(invited_commissioners),
  generated_election_results: many(generated_election_results),
  voter_fields: many(voter_fields),
  reported_problems: many(reported_problems),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  voter: one(voters, {
    fields: [votes.voter_id],
    references: [voters.id],
  }),
  candidate: one(candidates, {
    fields: [votes.candidate_id],
    references: [candidates.id],
  }),
  position: one(positions, {
    fields: [votes.position_id],
    references: [positions.id],
  }),
  election: one(elections, {
    fields: [votes.election_id],
    references: [elections.id],
  }),
}));

export const commissionersRelations = relations(commissioners, ({ one }) => ({
  user: one(users, {
    fields: [commissioners.user_id],
    references: [users.id],
  }),
  election: one(elections, {
    fields: [commissioners.election_id],
    references: [elections.id],
  }),
}));

export const invited_commissionersRelations = relations(
  invited_commissioners,
  ({ one, many }) => ({
    election: one(elections, {
      fields: [invited_commissioners.election_id],
      references: [elections.id],
    }),
    verification_tokens: many(verification_tokens),
  }),
);

export const votersRelations = relations(voters, ({ one, many }) => ({
  user: one(users, {
    fields: [voters.user_id],
    references: [users.id],
  }),
  election: one(elections, {
    fields: [voters.election_id],
    references: [elections.id],
  }),

  votes: many(votes),
}));

export const partylistsRelations = relations(partylists, ({ one, many }) => ({
  election: one(elections, {
    fields: [partylists.election_id],
    references: [elections.id],
  }),
  candidates: many(candidates),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  election: one(elections, {
    fields: [positions.election_id],
    references: [elections.id],
  }),
  candidates: many(candidates),
  votes: many(votes),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  election: one(elections, {
    fields: [candidates.election_id],
    references: [elections.id],
  }),
  partylist: one(partylists, {
    fields: [candidates.partylist_id],
    references: [partylists.id],
  }),
  position: one(positions, {
    fields: [candidates.position_id],
    references: [positions.id],
  }),
  credential: one(credentials, {
    fields: [candidates.credential_id],
    references: [credentials.id],
  }),
  platforms: many(platforms),
  votes: many(votes),
}));

export const verification_tokensRelations = relations(
  verification_tokens,
  ({ one }) => ({
    invited_commissioner: one(invited_commissioners, {
      fields: [verification_tokens.invited_commissioner_id],
      references: [invited_commissioners.id],
    }),
  }),
);

export const generated_election_resultsRelations = relations(
  generated_election_results,
  ({ one }) => ({
    election: one(elections, {
      fields: [generated_election_results.election_id],
      references: [elections.id],
    }),
  }),
);

export const voter_fieldsRelations = relations(voter_fields, ({ one }) => ({
  election: one(elections, {
    fields: [voter_fields.election_id],
    references: [elections.id],
  }),
}));

export const reported_problemsRelations = relations(
  reported_problems,
  ({ one }) => ({
    election: one(elections, {
      fields: [reported_problems.election_id],
      references: [elections.id],
    }),
    user: one(users, {
      fields: [reported_problems.user_id],
      references: [users.id],
    }),
  }),
);

export const credentialsRelations = relations(credentials, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [credentials.candidate_id],
    references: [candidates.id],
  }),
  affiliations: many(affiliations),
  achievements: many(achievements),
  events_attended: many(events_attended),
}));

export const platformsRelations = relations(platforms, ({ one }) => ({
  candidate: one(candidates, {
    fields: [platforms.candidate_id],
    references: [candidates.id],
  }),
}));

export const affiliationsRelations = relations(affiliations, ({ one }) => ({
  credential: one(credentials, {
    fields: [affiliations.credential_id],
    references: [credentials.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  credential: one(credentials, {
    fields: [achievements.credential_id],
    references: [credentials.id],
  }),
}));

export const events_attendedRelations = relations(
  events_attended,
  ({ one }) => ({
    credential: one(credentials, {
      fields: [events_attended.credential_id],
      references: [credentials.id],
    }),
  }),
);
