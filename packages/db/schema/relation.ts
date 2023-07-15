import { relations } from "drizzle-orm";
import {
  users,
  elections,
  votes,
  commissioners,
  voters,
  invited_voters,
  invited_commissioners,
  partylists,
  positions,
  candidates,
  verification_tokens,
  generated_election_results,
  voter_fields,
  reported_problems,
  credentials,
  platforms,
  affiliations,
  achievements,
  events_attended,
} from "./schema";

export const electionsRelations = relations(elections, ({ many }) => ({
  votes: many(votes),
  positions: many(positions),
  partylists: many(partylists),
  candidates: many(candidates),
  commissioners: many(commissioners),
  voters: many(voters),
  invited_voters: many(invited_voters),
  invited_commissioners: many(invited_commissioners),
  generated_election_results: many(generated_election_results),
  voter_fields: many(voter_fields),
  reported_problems: many(reported_problems),
  verification_tokens: many(verification_tokens),
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
  })
);

export const votersRelations = relations(voters, ({ one }) => ({
  user: one(users, {
    fields: [voters.user_id],
    references: [users.id],
  }),
  election: one(elections, {
    fields: [voters.election_id],
    references: [elections.id],
  }),
}));

export const invited_votersRelations = relations(
  invited_voters,
  ({ one, many }) => ({
    election: one(elections, {
      fields: [invited_voters.election_id],
      references: [elections.id],
    }),
    verification_tokens: many(verification_tokens),
  })
);

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
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  position: one(positions, {
    fields: [candidates.position_id],
    references: [positions.id],
  }),
  candidates: many(candidates),
  credentials: many(credentials),
  platforms: many(platforms),
  votes: many(votes),
}));

export const verification_tokensRelations = relations(
  verification_tokens,
  ({ one }) => ({
    user: one(users, {
      fields: [verification_tokens.user_id],
      references: [users.id],
    }),
    invited_voter: one(invited_voters, {
      fields: [verification_tokens.invited_voter_id],
      references: [invited_voters.id],
    }),
    invited_commissioner: one(invited_commissioners, {
      fields: [verification_tokens.invited_commissioner_id],
      references: [invited_commissioners.id],
    }),
  })
);

export const generated_election_resultsRelations = relations(
  generated_election_results,
  ({ one }) => ({
    election: one(elections, {
      fields: [generated_election_results.election_id],
      references: [elections.id],
    }),
  })
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
    user: one(users, {
      fields: [reported_problems.user_id],
      references: [users.id],
    }),
  })
);

export const credentialsRelations = relations(credentials, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [credentials.candidate_id],
    references: [candidates.id],
  }),
  affiliations: many(affiliations),
  achievements: many(achievements),
  eventsAttended: many(events_attended),
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
  })
);
