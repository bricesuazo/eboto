import type { AdapterAccount } from "@auth/core/adapters";
import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import type { UploadFileResponse } from "uploadthing/client";

const id = varchar("id", { length: 256 })
  .primaryKey()
  .notNull()
  .$defaultFn(() => nanoid());
const created_at = timestamp("created_at", { withTimezone: true })
  .default(sql`CURRENT_TIMESTAMP`)
  .notNull();
const deleted_at = timestamp("deleted_at", { withTimezone: true });
const updated_at = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull();
const election_id = varchar("election_id", { length: 256 })
  .references(() => elections.id, { onDelete: "cascade" })
  .notNull();
const user_id = varchar("user_id", { length: 256 })
  .references(() => users.id, { onDelete: "cascade" })
  .notNull();
const voter_id = varchar("voter_id", { length: 256 })
  .references(() => voters.id, { onDelete: "cascade" })
  .notNull();
const credential_id = varchar("credential_id", { length: 256 })
  .references(() => credentials.id, { onDelete: "cascade" })
  .notNull();

export const publicity = ["PRIVATE", "VOTER", "PUBLIC"] as const;
export type Publicity = (typeof publicity)[number];

export const token_type = [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
  "ELECTION_INVITATION",
] as const;
export type TokenType = (typeof token_type)[number];
type File = Pick<
  UploadFileResponse<undefined>,
  "key" | "name" | "size" | "url"
>;

export const publicityEnum = pgEnum("publicity", publicity);

export const elections = pgTable(
  "election",
  {
    id,
    slug: varchar("slug", { length: 256 }).notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    start_date: timestamp("start_date", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    end_date: timestamp("end_date", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    voting_hour_start: integer("voting_hour_start").notNull().default(7),
    voting_hour_end: integer("voting_hour_end").notNull().default(19),
    publicity: publicityEnum("publicity").default("PRIVATE").notNull(),
    logo: json("logo").$type<File>(),
    voter_domain: text("voter_domain"),
    is_candidates_visible_in_realtime_when_ongoing: boolean(
      "is_candidates_visible_in_realtime_when_ongoing",
    )
      .default(false)
      .notNull(),
    name_arrangement: integer("name_arrangement").default(0).notNull(),
    variant_id: integer("variant_id")
      .references(() => variants.id, { onDelete: "cascade" })
      .notNull(),
    deleted_at,

    created_at,
    updated_at,
  },
  (election) => ({
    electionStartDateIdx: index("electionStartDate_idx").on(
      election.start_date,
    ),
    electionEndDateIdx: index("electionEndDate_idx").on(election.end_date),
    electionVotingHourStartIdx: index("electionVotingHourStart_idx").on(
      election.voting_hour_start,
    ),
    electionVotingHourEndIdx: index("electionVotingHourEnd_idx").on(
      election.voting_hour_end,
    ),
    electionDeletedAtIdx: index("electionDeletedAt_idx").on(
      election.deleted_at,
    ),
    electionVariantIdIdx: index("electionVariantId_idx").on(
      election.variant_id,
    ),
  }),
);

export const votes = pgTable(
  "vote",
  {
    id,
    created_at,

    voter_id,
    candidate_id: varchar("candidate_id", { length: 256 }).references(
      () => candidates.id,
      { onDelete: "cascade" },
    ),
    position_id: varchar("position_id", { length: 256 }).references(
      () => positions.id,
      { onDelete: "cascade" },
    ),
    election_id,
  },
  (vote) => ({
    voteVoterIdIdx: index("voteVoterId_idx").on(vote.voter_id),
    voteCandidateIdIdx: index("voteCandidateId_idx").on(vote.candidate_id),
    votePositionIdIdx: index("votePositionId_idx").on(vote.position_id),
    voteElectionIdIdx: index("voteElectionId_idx").on(vote.election_id),
  }),
);

export const commissioners = pgTable(
  "commissioner",
  {
    id,
    created_at,

    deleted_at,

    user_id,
    election_id,
  },
  (commissioner) => ({
    commissionerElectionIdIdx: index("commissionerElectionId_idx").on(
      commissioner.election_id,
    ),
    commissionerUserIdElectionIdIdx: index(
      "commissionerUserIdElectionId_idx",
    ).on(commissioner.user_id, commissioner.election_id),
    commissionerDeletedAtIdx: index("commissionerDeletedAt_idx").on(
      commissioner.deleted_at,
    ),
  }),
);

export const voters = pgTable(
  "voter",
  {
    id,
    created_at,

    email: varchar("email", { length: 256 }).notNull(),
    field: json("field").$type<Record<string, string>>(),
    // user_id,

    deleted_at,

    election_id,
  },
  (voter) => ({
    voterEmailIdx: index("voterEmail_idx").on(voter.email),
    voterElectionIdIdx: index("voterElectionId_idx").on(voter.election_id),
  }),
);

export const partylists = pgTable(
  "partylist",
  {
    id,
    name: text("name").notNull(),
    acronym: text("acronym").notNull(),
    description: text("description").notNull().default(""),
    logo_link: text("logo_link"),

    created_at,
    updated_at,

    deleted_at,

    election_id,
  },
  (partylist) => ({
    partylistElectionIdIdx: index("partylistElectionId_idx").on(
      partylist.election_id,
    ),
  }),
);

export const positions = pgTable(
  "position",
  {
    id,
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    order: integer("order").notNull(),
    min: integer("min").default(0).notNull(),
    max: integer("max").default(1).notNull(),

    created_at,
    updated_at,

    deleted_at,

    election_id,
  },
  (position) => ({
    positionElectionIdIdx: index("positionElectionId_idx").on(
      position.election_id,
    ),
  }),
);

export const candidates = pgTable(
  "candidate",
  {
    id,
    slug: varchar("slug", { length: 256 }).notNull(),
    first_name: text("first_name").notNull(),
    middle_name: text("middle_name"),
    last_name: text("last_name").notNull(),
    image: json("image").$type<File>(),

    created_at,
    updated_at,

    deleted_at,

    election_id,
    credential_id,
    position_id: varchar("position_id", { length: 256 })
      .references(() => positions.id, { onDelete: "cascade" })
      .notNull(),
    partylist_id: varchar("partylist_id", { length: 256 })
      .references(() => partylists.id, { onDelete: "cascade" })
      .notNull(),
  },
  (candidate) => ({
    candidateSlugIdx: index("candidateSlug_idx").on(candidate.slug),
    candidateElectionIdIdx: index("candidateElectionId_idx").on(
      candidate.election_id,
    ),
    candidateCredentialIdIdx: index("candidateCredentialId_idx").on(
      candidate.credential_id,
    ),
    candidatePositionIdIdx: index("candidatePositionId_idx").on(
      candidate.position_id,
    ),
    candidatePartylistIdIdx: index("candidatePartylistId_idx").on(
      candidate.partylist_id,
    ),
  }),
);

export const credentials = pgTable("credential", {
  id,

  created_at,
  updated_at,
});

export const platforms = pgTable(
  "platform",
  {
    id,
    title: text("title").notNull(),
    description: text("description").notNull().default(""),

    created_at,
    updated_at,

    candidate_id: varchar("candidate_id", { length: 256 })
      .references(() => candidates.id, { onDelete: "cascade" })
      .notNull(),
  },
  (platform) => ({
    platformCandidateIdIdx: index("platformCandidateId_idx").on(
      platform.candidate_id,
    ),
  }),
);

export const affiliations = pgTable(
  "affiliation",
  {
    id,
    org_name: text("org_name").notNull(),
    org_position: text("org_position").notNull(),
    start_year: timestamp("start_year", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    end_year: timestamp("end_year", {
      mode: "date",
      withTimezone: true,
    }).notNull(),

    created_at,
    updated_at,

    credential_id,
  },
  (affiliation) => ({
    affiliationCredentialIdIdx: index("affiliationCredentialId_idx").on(
      affiliation.credential_id,
    ),
  }),
);

export const achievements = pgTable(
  "achievement",
  {
    id,
    name: text("name").notNull(),
    year: timestamp("year", { mode: "date", withTimezone: true }).notNull(),

    created_at,
    updated_at,

    credential_id,
  },
  (achievement) => ({
    achievementCredentialIdIdx: index("achievementCredentialId_idx").on(
      achievement.credential_id,
    ),
  }),
);

export const events_attended = pgTable(
  "event_attended",
  {
    id,
    name: text("name").notNull(),
    year: timestamp("year", { mode: "date", withTimezone: true }).notNull(),

    created_at,
    updated_at,

    credential_id,
  },
  (event_attended) => ({
    eventAttendedCredentialIdIdx: index("eventAttendedCredentialId_idx").on(
      event_attended.credential_id,
    ),
  }),
);

export const generated_election_results = pgTable(
  "generated_election_result",
  {
    id,

    created_at,

    election_id,
    result: json("result")
      .$type<
        Election & {
          positions: (Position & {
            abstain_count: number;
            candidates: (Candidate & {
              vote_count: number;
            })[];
          })[];
        }
      >()
      .notNull(),
  },
  (generated_election_result) => ({
    generatedElectionResultElectionIdIdx: index(
      "generatedElectionResultElectionId_idx",
    ).on(generated_election_result.election_id),
  }),
);
export const voter_fields = pgTable(
  "voter_field",
  {
    id,
    name: text("name").notNull(),

    created_at,

    election_id,
  },
  (voter_field) => ({
    voterFieldElectionIdIdx: index("voterFieldElectionId_idx").on(
      voter_field.election_id,
    ),
  }),
);

export const reported_problems = pgTable(
  "reported_problem",
  {
    id,
    subject: text("subject").notNull(),
    description: text("description").notNull(),

    created_at,

    election_id,
    user_id,
  },
  (reported_problem) => ({
    reportedProblemUserIdIdx: index("reportedProblemUserId_idx").on(
      reported_problem.user_id,
    ),
    reportedProblemElectionIdUserIdIdx: index(
      "reportedProblemElectionIdUserId_idx",
    ).on(reported_problem.election_id, reported_problem.user_id),
  }),
);

export const users = pgTable("user", {
  id,
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("emailVerified", {
    withTimezone: true,
  }).defaultNow(),
  image_file: json("image_file").$type<File>(),
  image: text("image"),
});

export const deleted_users = pgTable("deleted_user", {
  id,
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("emailVerified", {
    withTimezone: true,
  }).defaultNow(),
  image_file: json("image_file").$type<File>(),
  image: text("image"),
});

export const verification_tokens = pgTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const accounts = pgTable(
  "account",
  {
    userId: varchar("userId", { length: 255 }).notNull(),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: varchar("refresh_token", { length: 255 }),
    access_token: varchar("access_token", { length: 255 }),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    accountUserIdIdx: index("account_userId_idx").on(account.userId),
  }),
);
export const deleted_accounts = pgTable(
  "deleted_account",
  {
    deletedUserId: varchar("deletedUserId", { length: 255 }).notNull(),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: varchar("refresh_token", { length: 255 }),
    access_token: varchar("access_token", { length: 255 }),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (deleted_account) => ({
    compoundKey: primaryKey({
      columns: [deleted_account.provider, deleted_account.providerAccountId],
    }),
    deletedAccountDeletedUserIdIdx: index(
      "deletedAccount_deletedUserId_idx",
    ).on(deleted_account.deletedUserId),
  }),
);
export const sessions = pgTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 256 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    expires: timestamp("expires", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (session) => ({
    sessionUserIdIdx: index("sessionUserId_idx").on(session.userId),
  }),
);

export const commissioners_voters_messages = pgTable(
  "commissioners_voters_message",
  {
    id,
    message: text("message").notNull(),

    created_at,
    deleted_at,

    room_id: varchar("room_id", { length: 256 })
      // .references(() => commissioners_voters_rooms.id, { onDelete: "cascade" })
      .notNull(),
    user_id,
  },
  (commissioners_voters_message) => ({
    roomReference: foreignKey({
      columns: [commissioners_voters_message.room_id],
      foreignColumns: [commissioners_voters_rooms.id],
      name: "CVM_RoomReference",
    }),
    commissionersVotersMsgRoomIdIdx: index("CVM_CVMRI_idx").on(
      commissioners_voters_message.room_id,
    ),
    commissionersVotersMsgUserIdIdx: index("CVM_CVMUI_idx").on(
      commissioners_voters_message.user_id,
    ),
  }),
);

export const commissioners_voters_rooms = pgTable(
  "commissioners_voters_room",
  {
    id,
    name: text("name").notNull(),

    created_at,
    deleted_at,

    election_id,
  },
  (commissioners_voters_room) => ({
    commissionersVotersRoomElectionIdIdx: index("CVR_CVREI_idx").on(
      commissioners_voters_room.election_id,
    ),
  }),
);

export const admin_commissioners_messages = pgTable(
  "admin_commissioners_message",
  {
    id,
    message: text("message").notNull(),

    created_at,
    deleted_at,

    room_id: varchar("room_id", { length: 256 })
      // .references(() => admin_commissioners_rooms.id, { onDelete: "cascade" })
      .notNull(),
    user_id: varchar("user_id", { length: 256 }).references(() => users.id, {
      onDelete: "cascade",
    }),
  },
  (admin_commissioners_message) => ({
    roomReference: foreignKey({
      columns: [admin_commissioners_message.room_id],
      foreignColumns: [admin_commissioners_rooms.id],
      name: "ACM_RoomReference",
    }),
    commissionersVotersMsgRoomIdIdx: index("ACM_CVMRI_idx").on(
      admin_commissioners_message.room_id,
    ),
    commissionersVotersMsgUserIdIdx: index("ACM_CVMUI_idx").on(
      admin_commissioners_message.user_id,
    ),
  }),
);

export const admin_commissioners_rooms = pgTable(
  "admin_commissioners_room",
  {
    id,
    name: text("name").notNull(),

    created_at,
    deleted_at,

    election_id,
  },
  (admin_commissioners_room) => ({
    commissionersVotersRoomElectionIdIdx: index("ACR_CVREI_idx").on(
      admin_commissioners_room.election_id,
    ),
  }),
);

export const products = pgTable("product", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
});

export const variants = pgTable("variant", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  product_id: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
});

export const elections_plus = pgTable(
  "election_plus",
  {
    id,
    user_id,

    created_at,
    redeemed_at: timestamp("redeemed_at", { withTimezone: true }),
  },
  (election_plus) => ({
    electionPlusUserIdIdx: index("electionPlusUserId_idx").on(
      election_plus.user_id,
    ),
  }),
);

export type Election = typeof elections.$inferSelect;
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type DeletedAccount = typeof deleted_accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type DeletedUser = typeof deleted_users.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Commissioner = typeof commissioners.$inferSelect;
export type Voter = typeof voters.$inferSelect;
export type Partylist = typeof partylists.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Credential = typeof credentials.$inferSelect;
export type Platform = typeof platforms.$inferSelect;
export type Affiliation = typeof affiliations.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type EventAttended = typeof events_attended.$inferSelect;
export type VerificationToken = typeof verification_tokens.$inferSelect;
export type GeneratedElectionResult =
  typeof generated_election_results.$inferSelect;
export type VoterField = typeof voter_fields.$inferSelect;
export type ReportedProblem = typeof reported_problems.$inferSelect;

export type CommissionersVotersMessage =
  typeof commissioners_voters_messages.$inferSelect;
export type CommissionersVotersRoom =
  typeof commissioners_voters_rooms.$inferSelect;
export type AdminCommissionersMessage =
  typeof admin_commissioners_messages.$inferSelect;
export type AdminCommissionersRoom =
  typeof admin_commissioners_rooms.$inferSelect;

export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type ElectionPlus = typeof elections_plus.$inferSelect;
