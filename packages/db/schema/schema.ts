import { sql } from "drizzle-orm";
import {
  date,
  index,
  int,
  longtext,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";

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
export const account_status_type = ["ADDED", "INVITED", "DECLINED"] as const;
export type AccountStatusType = (typeof account_status_type)[number];

export const elections = mysqlTable("elections", {
  id,
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  name: text("name").notNull(),
  description: longtext("description"),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  publicity: mysqlEnum("publicity", publicity).default("PRIVATE").notNull(),
  logo: longtext("logo"),
  voter_domain: text("voter_domain"),
  deleted_at,

  created_at,
  updated_at,
});

export const votes = mysqlTable("votes", {
  id,
  created_at,

  voter_id,
  candidate_id: varchar("candidate_id", { length: 256 }),
  position_id: varchar("position_id", { length: 256 }),
  election_id,
});

export const commissioners = mysqlTable("commissioners", {
  id,
  created_at,

  deleted_at,

  user_id,
  election_id,
});

export const invited_commissioners = mysqlTable("invited_commissioners", {
  id,
  email: text("email").notNull(),
  status: mysqlEnum("status", account_status_type).default("INVITED"),

  created_at,

  election_id,
});

export const voters = mysqlTable("voters", {
  id,
  created_at,

  email: text("email").notNull(),

  deleted_at,

  user_id,
  election_id,
});

export const partylists = mysqlTable("partylists", {
  id,
  name: text("name").notNull(),
  acronym: text("acronym").notNull(),
  description: longtext("description"),
  logo_link: longtext("logo_link"),

  created_at,
  updated_at,

  deleted_at,

  election_id,
});

export const positions = mysqlTable("positions", {
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
});

export const candidates = mysqlTable("candidates", {
  id,
  slug: varchar("slug", { length: 256 }).notNull(),
  first_name: text("first_name").notNull(),
  middle_name: text("middle_name"),
  last_name: text("last_name").notNull(),
  image_link: longtext("image_link"),

  created_at,
  updated_at,

  deleted_at,

  election_id,
  credential_id: varchar("credential_id", { length: 256 }).notNull(),
  position_id: varchar("position_id", { length: 256 }).notNull(),
  partylist_id: varchar("partylist_id", { length: 256 }).notNull(),
});

export const credentials = mysqlTable("credentials", {
  id,

  created_at,
  updated_at,

  candidate_id: varchar("candidate_id", { length: 256 }).notNull(),
});

export const platforms = mysqlTable("platforms", {
  id,
  title: text("title").notNull(),
  description: longtext("description").notNull(),

  created_at,
  updated_at,

  candidate_id: varchar("candidate_id", { length: 256 }).notNull(),
});

export const affiliations = mysqlTable("affiliations", {
  id,
  org_name: text("org_name").notNull(),
  org_position: text("org_position").notNull(),
  start_year: date("start_year").notNull(),
  end_year: date("end_year").notNull(),

  created_at,
  updated_at,

  credential_id: varchar("credential_id", { length: 256 }).notNull(),
});

export const achievements = mysqlTable("achievements", {
  id,
  name: text("name").notNull(),
  year: date("year").notNull(),

  created_at,
  updated_at,

  credential_id: varchar("credential_id", { length: 256 }).notNull(),
});

export const events_attended = mysqlTable("events_attended", {
  id,
  name: text("name").notNull(),
  year: date("year").notNull(),

  created_at,
  updated_at,

  credential_id: varchar("credential_id", { length: 256 }).notNull(),
});

export const verification_tokens = mysqlTable("verification_tokens", {
  id,
  type: mysqlEnum("type", token_type).notNull(),
  expires_at: timestamp("expires_at").notNull(),

  created_at,
  updated_at,

  invited_commissioner_id: varchar("invited_commissioner_id", { length: 256 }),
});

export const generated_election_results = mysqlTable(
  "generated_election_results",
  {
    id,
    name: text("name").notNull(),
    link: longtext("link"),

    created_at,

    election_id,
  },
);
export const voter_fields = mysqlTable("voter_fields", {
  id,
  name: text("name").notNull(),

  created_at,

  election_id,
});

export const reported_problems = mysqlTable("reported_problems", {
  id,
  subject: longtext("subject").notNull(),
  description: longtext("description").notNull(),

  created_at,

  election_id,
  user_id,
});

export type Election = typeof elections.$inferSelect;
export type User = typeof users.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Commissioner = typeof commissioners.$inferSelect;
export type InvitedCommissioner = typeof invited_commissioners.$inferSelect;
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

import type { AdapterAccount } from "@auth/core/adapters";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    fsp: 3,
  }).default(sql`CURRENT_TIMESTAMP(3)`),
  image: varchar("image", { length: 255 }),
});


export const accounts = mysqlTable(
  "accounts",
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
    userIdIdx: index("userId_idx").on(account.userId),
  }),
);


export const sessions = mysqlTable(
  "sessions",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("userId_idx").on(session.userId),
  }),
);



export const verificationTokens = mysqlTable(
  "verificationTokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  }),
);