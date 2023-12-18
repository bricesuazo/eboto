import type { AdapterAccount } from "@auth/core/adapters";
import { sql } from "drizzle-orm";
import {
  date,
  index,
  int,
  json,
  longtext,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";
import type { UploadFileResponse } from "uploadthing/client";

const id = varchar("id", { length: 256 })
  .primaryKey()
  .notNull()
  .unique()
  .$defaultFn(() => nanoid());
const created_at = timestamp("created_at")
  .default(sql`CURRENT_TIMESTAMP`)
  .notNull();
const deleted_at = timestamp("deleted_at");
const updated_at = timestamp("updated_at")
  .default(sql`CURRENT_TIMESTAMP`)
  .onUpdateNow()
  .notNull();
const election_id = varchar("election_id", { length: 256 }).notNull();
const user_id = varchar("user_id", { length: 256 }).notNull();
const voter_id = varchar("voter_id", { length: 256 }).notNull();

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

export const elections = mysqlTable(
  "election",
  {
    id,
    slug: varchar("slug", { length: 256 }).notNull().unique(),
    name: text("name").notNull(),
    description: longtext("description"),
    start_date: date("start_date").notNull(),
    end_date: date("end_date").notNull(),
    voting_hour_start: int("voting_hour_start").notNull().default(7),
    voting_hour_end: int("voting_hour_end").notNull().default(19),
    publicity: mysqlEnum("publicity", publicity).default("PRIVATE").notNull(),
    logo: json("logo").$type<File>(),
    voter_domain: text("voter_domain"),
    deleted_at,

    created_at,
    updated_at,
  },
  (election) => ({
    electionIdIdx: index("electionId_idx").on(election.id),
    electionSlugIdx: index("electionSlug_idx").on(election.slug),
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
  }),
);

export const votes = mysqlTable(
  "vote",
  {
    id,
    created_at,

    voter_id,
    candidate_id: varchar("candidate_id", { length: 256 }),
    position_id: varchar("position_id", { length: 256 }),
    election_id,
  },
  (vote) => ({
    voteIdIdx: index("voteId_idx").on(vote.id),
    voteVoterIdIdx: index("voteVoterId_idx").on(vote.voter_id),
    voteCandidateIdIdx: index("voteCandidateId_idx").on(vote.candidate_id),
    votePositionIdIdx: index("votePositionId_idx").on(vote.position_id),
    voteElectionIdIdx: index("voteElectionId_idx").on(vote.election_id),
  }),
);

export const commissioners = mysqlTable(
  "commissioner",
  {
    id,
    created_at,

    deleted_at,

    user_id,
    election_id,
  },
  (commissioner) => ({
    commissionerIdIdx: index("commissionerId_idx").on(commissioner.id),
    commissionerElectionIdIdx: index("commissionerElectionId_idx").on(
      commissioner.election_id,
    ),
    commissionerUserIdIdx: index("commissionerUserId_idx").on(
      commissioner.user_id,
    ),
    commissionerUserIdElectionIdIdx: index(
      "commissionerUserIdElectionId_idx",
    ).on(commissioner.user_id, commissioner.election_id),
    commissionerDeletedAtIdx: index("commissionerDeletedAt_idx").on(
      commissioner.deleted_at,
    ),
  }),
);

export const voters = mysqlTable(
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
    voterIdIdx: index("voterId_idx").on(voter.id),
    voterEmailIdx: index("voterEmail_idx").on(voter.email),
    voterElectionIdIdx: index("voterElectionId_idx").on(voter.election_id),
  }),
);

export const partylists = mysqlTable(
  "partylist",
  {
    id,
    name: text("name").notNull(),
    acronym: text("acronym").notNull(),
    description: longtext("description"),
    logo_link: longtext("logo_link"),

    created_at,
    updated_at,

    deleted_at,

    election_id,
  },
  (partylist) => ({
    partylistIdIdx: index("partylistId_idx").on(partylist.id),
    partylistElectionIdIdx: index("partylistElectionId_idx").on(
      partylist.election_id,
    ),
  }),
);

export const positions = mysqlTable(
  "position",
  {
    id,
    name: text("name").notNull(),
    description: longtext("description"),
    order: int("order").notNull(),
    min: int("min").default(0).notNull(),
    max: int("max").default(1).notNull(),

    created_at,
    updated_at,

    deleted_at,

    election_id,
  },
  (position) => ({
    positionIdIdx: index("positionId_idx").on(position.id),
    positionElectionIdIdx: index("positionElectionId_idx").on(
      position.election_id,
    ),
  }),
);

export const candidates = mysqlTable(
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
    credential_id: varchar("credential_id", { length: 256 }).notNull(),
    position_id: varchar("position_id", { length: 256 }).notNull(),
    partylist_id: varchar("partylist_id", { length: 256 }).notNull(),
  },
  (candidate) => ({
    candidateIdIdx: index("candidateId_idx").on(candidate.id),
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

export const credentials = mysqlTable(
  "credential",
  {
    id,

    created_at,
    updated_at,

    candidate_id: varchar("candidate_id", { length: 256 }).notNull(),
  },
  (credential) => ({
    credentialIdIdx: index("credentialId_idx").on(credential.id),
    credentialCandidateIdIdx: index("credentialCandidateId_idx").on(
      credential.candidate_id,
    ),
  }),
);

export const platforms = mysqlTable(
  "platform",
  {
    id,
    title: text("title").notNull(),
    description: longtext("description"),

    created_at,
    updated_at,

    candidate_id: varchar("candidate_id", { length: 256 }).notNull(),
  },
  (platform) => ({
    platformIdIdx: index("platformId_idx").on(platform.id),
    platformCandidateIdIdx: index("platformCandidateId_idx").on(
      platform.candidate_id,
    ),
  }),
);

export const affiliations = mysqlTable(
  "affiliation",
  {
    id,
    org_name: text("org_name").notNull(),
    org_position: text("org_position").notNull(),
    start_year: date("start_year").notNull(),
    end_year: date("end_year").notNull(),

    created_at,
    updated_at,

    credential_id: varchar("credential_id", { length: 256 }).notNull(),
  },
  (affiliation) => ({
    affiliationIdIdx: index("affiliationId_idx").on(affiliation.id),
    affiliationCredentialIdIdx: index("affiliationCredentialId_idx").on(
      affiliation.credential_id,
    ),
  }),
);

export const achievements = mysqlTable(
  "achievement",
  {
    id,
    name: text("name").notNull(),
    year: date("year").notNull(),

    created_at,
    updated_at,

    credential_id: varchar("credential_id", { length: 256 }).notNull(),
  },
  (achievement) => ({
    achievementIdIdx: index("achievementId_idx").on(achievement.id),
    achievementCredentialIdIdx: index("achievementCredentialId_idx").on(
      achievement.credential_id,
    ),
  }),
);

export const events_attended = mysqlTable(
  "event_attended",
  {
    id,
    name: text("name").notNull(),
    year: date("year").notNull(),

    created_at,
    updated_at,

    credential_id: varchar("credential_id", { length: 256 }).notNull(),
  },
  (event_attended) => ({
    eventAttendedIdIdx: index("eventAttendedId_idx").on(event_attended.id),
    eventAttendedCredentialIdIdx: index("eventAttendedCredentialId_idx").on(
      event_attended.credential_id,
    ),
  }),
);

export const generated_election_results = mysqlTable(
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
    generatedElectionResultIdIdx: index("generatedElectionResultId_idx").on(
      generated_election_result.id,
    ),
    generatedElectionResultElectionIdIdx: index(
      "generatedElectionResultElectionId_idx",
    ).on(generated_election_result.election_id),
  }),
);
export const voter_fields = mysqlTable(
  "voter_field",
  {
    id,
    name: text("name").notNull(),

    created_at,

    election_id,
  },
  (voter_field) => ({
    voterFieldIdIdx: index("voterFieldId_idx").on(voter_field.id),
    voterFieldElectionIdIdx: index("voterFieldElectionId_idx").on(
      voter_field.election_id,
    ),
  }),
);

export const reported_problems = mysqlTable(
  "reported_problem",
  {
    id,
    subject: longtext("subject").notNull(),
    description: longtext("description").notNull(),

    created_at,

    election_id,
    user_id,
  },
  (reported_problem) => ({
    reportedProblemIdIdx: index("reportedProblemId_idx").on(
      reported_problem.id,
    ),
    reportedProblemElectionIdIdx: index("reportedProblemElectionId_idx").on(
      reported_problem.election_id,
    ),
    reportedProblemUserIdIdx: index("reportedProblemUserId_idx").on(
      reported_problem.user_id,
    ),
  }),
);

export const users = mysqlTable(
  "user",
  {
    id,
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("emailVerified", {
      mode: "date",
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    image_file: json("image_file").$type<File>(),
    image: text("image"),
  },
  (user) => ({
    userIdIdx: index("userId_idx").on(user.id),
    userEmailIdx: index("userEmail_idx").on(user.email),
  }),
);

export const deleted_users = mysqlTable(
  "deleted_user",
  {
    id,
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("emailVerified", {
      mode: "date",
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    image_file: json("image_file").$type<File>(),
    image: text("image"),
  },
  (user) => ({
    deletedUserIdIdx: index("deletedUserId_idx").on(user.id),
    deletedUserEmailIdx: index("deletedUserEmail_idx").on(user.email),
  }),
);

export const verification_tokens = mysqlTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  }),
);

export const accounts = mysqlTable(
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
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
    accountUserIdIdx: index("account_userId_idx").on(account.userId),
  }),
);
export const deleted_accounts = mysqlTable(
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
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (deleted_account) => ({
    compoundKey: primaryKey(
      deleted_account.provider,
      deleted_account.providerAccountId,
    ),
    deletedAccountDeletedUserIdIdx: index(
      "deletedAccount_deletedUserId_idx",
    ).on(deleted_account.deletedUserId),
  }),
);
export const sessions = mysqlTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    sessionUserIdIdx: index("sessionUserId_idx").on(session.userId),
    sessionTokenIdx: index("sessionToken_idx").on(session.sessionToken),
  }),
);

export const commissioners_voters_messages = mysqlTable(
  "commissioners_voters_message",
  {
    id,
    message: text("message").notNull(),

    created_at,
    deleted_at,

    room_id: varchar("room_id", { length: 256 }).notNull(),
    user_id,
  },
  (commissioners_voters_message) => ({
    commissionersVotersMessageIdIdx: index(
      "commissionersVotersMessageId_idx",
    ).on(commissioners_voters_message.id),
    commissionersVotersMessageRoomIdIdx: index(
      "commissionersVotersMessageRoomId_idx",
    ).on(commissioners_voters_message.room_id),
    commissionersVotersMessageUserIdIdx: index(
      "commissionersVotersMessageUserId_idx",
    ).on(commissioners_voters_message.user_id),
  }),
);

export const commissioners_voters_rooms = mysqlTable(
  "commissioners_voters_room",
  {
    id,
    name: text("name").notNull(),

    created_at,
    deleted_at,

    election_id,
  },
  (commissioners_voters_room) => ({
    commissionersVotersRoomIdIdx: index("commissionersVotersRoomId_idx").on(
      commissioners_voters_room.id,
    ),
    commissionersVotersRoomElectionIdIdx: index(
      "commissionersVotersRoomElectionId_idx",
    ).on(commissioners_voters_room.election_id),
  }),
);

export const admin_commissioners_messages = mysqlTable(
  "admin_commissioners_message",
  {
    id,
    message: text("message").notNull(),

    created_at,
    deleted_at,

    room_id: varchar("room_id", { length: 256 }).notNull(),
    user_id,
  },
  (admin_commissioners_message) => ({
    commissionersVotersMessageIdIdx: index(
      "commissionersVotersMessageId_idx",
    ).on(admin_commissioners_message.id),
    commissionersVotersMessageRoomIdIdx: index(
      "commissionersVotersMessageRoomId_idx",
    ).on(admin_commissioners_message.room_id),
    commissionersVotersMessageUserIdIdx: index(
      "commissionersVotersMessageUserId_idx",
    ).on(admin_commissioners_message.user_id),
  }),
);

export const admin_commissioners_rooms = mysqlTable(
  "admin_commissioners_room",
  {
    id,
    name: text("name").notNull(),

    created_at,
    deleted_at,

    election_id,
  },
  (admin_commissioners_room) => ({
    commissionersVotersRoomIdIdx: index("commissionersVotersRoomId_idx").on(
      admin_commissioners_room.id,
    ),
    commissionersVotersRoomElectionIdIdx: index(
      "commissionersVotersRoomElectionId_idx",
    ).on(admin_commissioners_room.election_id),
  }),
);

export type Election = typeof elections.$inferSelect;
export type User = typeof users.$inferSelect;
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
