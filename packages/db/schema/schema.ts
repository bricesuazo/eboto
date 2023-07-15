import { relations } from "drizzle-orm";
import {
  mysqlTable,
  timestamp,
  text,
  longtext,
  mysqlEnum,
  varchar,
  int,
} from "drizzle-orm/mysql-core";

const publicity = ["PRIVATE", "VOTER", "PUBLIC"] as const;

export const elections = mysqlTable("elections", {
  id: varchar("id", { length: 256 }).primaryKey().notNull().unique(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  name: text("name").notNull(),
  description: longtext("description"),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  publicity: mysqlEnum("publicity", publicity).default("PRIVATE"),
  logo: longtext("logo"),
  voter_domain: text("voter_domain"),

  // commissioners           Commissioner[]
  // voters                  Voter[]
  // vote                    Vote[]
  // invitedVoter            InvitedVoter[]
  // invitedCommissioner     InvitedCommissioner[]
  // generatedElectionResult GeneratedElectionResult[]
  // voterField              VoterField[]

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const partylists = mysqlTable("partylists", {
  id: varchar("id", { length: 256 }).primaryKey().notNull().unique(),
  name: text("name").notNull(),
  acronym: text("acronym").notNull(),
  description: longtext("description"),
  logo_link: longtext("logo_link"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),

  election_id: varchar("election_id", { length: 256 }).notNull(),
});

export const positions = mysqlTable("positions", {
  id: varchar("id", { length: 256 }).primaryKey().notNull().unique(),
  name: text("name").notNull(),
  description: longtext("description"),
  order: int("order").notNull(),
  min: int("min").default(0).notNull(),
  max: int("max").default(1).notNull(),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),

  election_id: varchar("election_id", { length: 256 }).notNull(),
});

export const candidates = mysqlTable("candidates", {
  id: varchar("id", { length: 256 }).primaryKey().notNull().unique(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  first_name: text("first_name").notNull(),
  middle_name: text("middle_name"),
  last_name: text("last_name").notNull(),
  image_link: longtext("image_link"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),

  election_id: varchar("election_id", { length: 256 }).notNull(),
  position_id: varchar("position_id", { length: 256 }).notNull(),
  partylist_id: varchar("partylist_id", { length: 256 }).notNull(),

  // credential Credential?
  // platform   Platform[]
  // vote       Vote[]
});

export const users = mysqlTable("users", {
  id: varchar("id", { length: 256 }).primaryKey().notNull().unique(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  email_verified: timestamp("email_verified"),
  first_name: text("first_name").notNull(),
  middle_name: text("middle_name"),
  last_name: text("last_name").notNull(),
  image_link: longtext("image_link"),
  password: longtext("password"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),

  // votes         Vote[]
  // tokens        VerificationToken[]
  // commissioners Commissioner[]
  // voters        Voter[]
  // reportProblem ReportProblem[]
});

export const electionsRelations = relations(elections, ({ many }) => ({
  positions: many(positions),
  partylists: many(partylists),
  candidates: many(candidates),
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
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  position: one(positions, {
    fields: [candidates.position_id],
    references: [positions.id],
  }),
  candidates: many(candidates),
}));
