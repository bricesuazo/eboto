import { relations } from "drizzle-orm";

import {
  accounts,
  achievements,
  admin_commissioners_messages,
  admin_commissioners_rooms,
  affiliations,
  candidates,
  commissioners,
  commissioners_voters_messages,
  commissioners_voters_rooms,
  credentials,
  deleted_accounts,
  deleted_users,
  elections,
  elections_plus,
  events_attended,
  generated_election_results,
  partylists,
  platforms,
  positions,
  products,
  reported_problems,
  sessions,
  users,
  variants,
  voter_fields,
  voters,
  votes,
} from "./schema";

export const electionsRelations = relations(elections, ({ one, many }) => ({
  votes: many(votes),
  positions: many(positions),
  partylists: many(partylists),
  candidates: many(candidates),
  commissioners: many(commissioners),
  voters: many(voters),
  generated_election_results: many(generated_election_results),
  voter_fields: many(voter_fields),
  reported_problems: many(reported_problems),
  variant: one(variants, {
    fields: [elections.variant_id],
    references: [variants.id],
  }),
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

export const votersRelations = relations(voters, ({ one, many }) => ({
  election: one(elections, {
    fields: [voters.election_id],
    references: [elections.id],
  }),
  // user: one(users, {
  //   fields: [voters.user_id],
  //   references: [users.id],
  // }),

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

// export const verification_tokensRelations = relations(
//   verification_tokens,
//   ({ one }) => ({
//     invited_commissioner: one(invited_commissioners, {
//       fields: [verification_tokens.invited_commissioner_id],
//       references: [invited_commissioners.id],
//     }),
//   }),
// );

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

export const credentialsRelations = relations(credentials, ({ many }) => ({
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

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));
export const deletedUsersRelations = relations(deleted_users, ({ many }) => ({
  accounts: many(deleted_accounts),
}));
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
export const deletedAccountsRelations = relations(
  deleted_accounts,
  ({ one }) => ({
    user: one(deleted_users, {
      fields: [deleted_accounts.deletedUserId],
      references: [deleted_users.id],
    }),
  }),
);
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const commissionersVotersMessagesRelations = relations(
  commissioners_voters_messages,
  ({ one }) => ({
    user: one(users, {
      fields: [commissioners_voters_messages.user_id],
      references: [users.id],
    }),
    room: one(commissioners_voters_rooms, {
      fields: [commissioners_voters_messages.room_id],
      references: [commissioners_voters_rooms.id],
    }),
  }),
);

export const commissionersVotersRoomsRelations = relations(
  commissioners_voters_rooms,
  ({ one, many }) => ({
    messages: many(commissioners_voters_messages),
    election: one(elections, {
      fields: [commissioners_voters_rooms.election_id],
      references: [elections.id],
    }),
  }),
);

export const adminCommissionersMessagesRelations = relations(
  admin_commissioners_messages,
  ({ one }) => ({
    user: one(users, {
      fields: [admin_commissioners_messages.user_id],
      references: [users.id],
    }),
    room: one(admin_commissioners_rooms, {
      fields: [admin_commissioners_messages.room_id],
      references: [admin_commissioners_rooms.id],
    }),
  }),
);

export const adminCommissionersRoomsRelations = relations(
  admin_commissioners_rooms,
  ({ one, many }) => ({
    messages: many(admin_commissioners_messages),
    election: one(elections, {
      fields: [admin_commissioners_rooms.election_id],
      references: [elections.id],
    }),
  }),
);

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(variants),
}));

export const variantsRelations = relations(variants, ({ one }) => ({
  product: one(products, {
    fields: [variants.product_id],
    references: [products.id],
  }),
}));
export const elections_plusRelations = relations(elections_plus, ({ one }) => ({
  user: one(users, {
    fields: [elections_plus.user_id],
    references: [users.id],
  }),
}));
