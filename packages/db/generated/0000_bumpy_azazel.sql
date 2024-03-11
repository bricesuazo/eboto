DO $$ BEGIN
 CREATE TYPE "publicity" AS ENUM('PRIVATE', 'VOTER', 'PUBLIC');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" varchar(255),
	"access_token" varchar(255),
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "achievement" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"year" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"credential_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_commissioners_message" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	"room_id" varchar(256) NOT NULL,
	"user_id" varchar(256)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_commissioners_room" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	"election_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliation" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"org_name" text NOT NULL,
	"org_position" text NOT NULL,
	"start_year" timestamp NOT NULL,
	"end_year" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"credential_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"slug" varchar(256) NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"image" json,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"election_id" varchar(256) NOT NULL,
	"credential_id" varchar(256) NOT NULL,
	"position_id" varchar(256) NOT NULL,
	"partylist_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commissioner" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	"user_id" varchar(256) NOT NULL,
	"election_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commissioners_voters_message" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	"room_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commissioners_voters_room" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	"election_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credential" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deleted_account" (
	"deletedUserId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" varchar(255),
	"access_token" varchar(255),
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "deleted_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deleted_user" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp DEFAULT now(),
	"image_file" json,
	"image" text,
	CONSTRAINT "deleted_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "election" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"slug" varchar(256) NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"voting_hour_start" integer DEFAULT 7 NOT NULL,
	"voting_hour_end" integer DEFAULT 19 NOT NULL,
	"publicity" "publicity" DEFAULT 'PRIVATE' NOT NULL,
	"logo" json,
	"voter_domain" text,
	"is_candidates_visible_in_realtime_when_ongoing" boolean DEFAULT false NOT NULL,
	"name_arrangement" integer DEFAULT 0 NOT NULL,
	"variant_id" integer NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "election_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "election_plus" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"redeemed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_attended" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"year" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"credential_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "generated_election_result" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"election_id" varchar(256) NOT NULL,
	"result" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partylist" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"acronym" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"logo_link" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"election_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"candidate_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "position" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"order" integer NOT NULL,
	"min" integer DEFAULT 0 NOT NULL,
	"max" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"election_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reported_problem" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"election_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(256) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp DEFAULT now(),
	"image_file" json,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variant" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"product_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voter_field" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"election_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voter" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"email" varchar(256) NOT NULL,
	"field" json,
	"deleted_at" timestamp,
	"election_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vote" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"voter_id" varchar(256) NOT NULL,
	"candidate_id" varchar(256),
	"position_id" varchar(256),
	"election_id" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "achievementCredentialId_idx" ON "achievement" ("credential_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ACM_CVMRI_idx" ON "admin_commissioners_message" ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ACM_CVMUI_idx" ON "admin_commissioners_message" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ACR_CVREI_idx" ON "admin_commissioners_room" ("election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliationCredentialId_idx" ON "affiliation" ("credential_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidateSlug_idx" ON "candidate" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidateElectionId_idx" ON "candidate" ("election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidateCredentialId_idx" ON "candidate" ("credential_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidatePositionId_idx" ON "candidate" ("position_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidatePartylistId_idx" ON "candidate" ("partylist_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commissionerElectionId_idx" ON "commissioner" ("election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commissionerUserIdElectionId_idx" ON "commissioner" ("user_id","election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commissionerDeletedAt_idx" ON "commissioner" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "CVM_CVMRI_idx" ON "commissioners_voters_message" ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "CVM_CVMUI_idx" ON "commissioners_voters_message" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "CVR_CVREI_idx" ON "commissioners_voters_room" ("election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deletedAccount_deletedUserId_idx" ON "deleted_account" ("deletedUserId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electionStartDate_idx" ON "election" ("start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electionEndDate_idx" ON "election" ("end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electionVotingHourStart_idx" ON "election" ("voting_hour_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electionVotingHourEnd_idx" ON "election" ("voting_hour_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electionDeletedAt_idx" ON "election" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electionVariantId_idx" ON "election" ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electionPlusUserId_idx" ON "election_plus" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventAttendedCredentialId_idx" ON "event_attended" ("credential_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generatedElectionResultElectionId_idx" ON "generated_election_result" ("election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partylistElectionId_idx" ON "partylist" ("election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "platformCandidateId_idx" ON "platform" ("candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "positionElectionId_idx" ON "position" ("election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reportedProblemUserId_idx" ON "reported_problem" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reportedProblemElectionIdUserId_idx" ON "reported_problem" ("election_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessionUserId_idx" ON "session" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voterFieldElectionId_idx" ON "voter_field" ("election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voterEmail_idx" ON "voter" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voterElectionId_idx" ON "voter" ("election_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voteVoterId_idx" ON "vote" ("voter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voteCandidateId_idx" ON "vote" ("candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "votePositionId_idx" ON "vote" ("position_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voteElectionId_idx" ON "vote" ("election_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "achievement" ADD CONSTRAINT "achievement_credential_id_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "credential"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_commissioners_message" ADD CONSTRAINT "admin_commissioners_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_commissioners_message" ADD CONSTRAINT "ACM_RoomReference" FOREIGN KEY ("room_id") REFERENCES "admin_commissioners_room"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_commissioners_room" ADD CONSTRAINT "admin_commissioners_room_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "affiliation" ADD CONSTRAINT "affiliation_credential_id_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "credential"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate" ADD CONSTRAINT "candidate_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate" ADD CONSTRAINT "candidate_credential_id_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "credential"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate" ADD CONSTRAINT "candidate_position_id_position_id_fk" FOREIGN KEY ("position_id") REFERENCES "position"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate" ADD CONSTRAINT "candidate_partylist_id_partylist_id_fk" FOREIGN KEY ("partylist_id") REFERENCES "partylist"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commissioner" ADD CONSTRAINT "commissioner_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commissioner" ADD CONSTRAINT "commissioner_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commissioners_voters_message" ADD CONSTRAINT "commissioners_voters_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commissioners_voters_message" ADD CONSTRAINT "CVM_RoomReference" FOREIGN KEY ("room_id") REFERENCES "commissioners_voters_room"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commissioners_voters_room" ADD CONSTRAINT "commissioners_voters_room_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "election" ADD CONSTRAINT "election_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "variant"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "election_plus" ADD CONSTRAINT "election_plus_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_attended" ADD CONSTRAINT "event_attended_credential_id_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "credential"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generated_election_result" ADD CONSTRAINT "generated_election_result_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partylist" ADD CONSTRAINT "partylist_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "platform" ADD CONSTRAINT "platform_candidate_id_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "position" ADD CONSTRAINT "position_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reported_problem" ADD CONSTRAINT "reported_problem_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reported_problem" ADD CONSTRAINT "reported_problem_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variant" ADD CONSTRAINT "variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voter_field" ADD CONSTRAINT "voter_field_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voter" ADD CONSTRAINT "voter_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote" ADD CONSTRAINT "vote_voter_id_voter_id_fk" FOREIGN KEY ("voter_id") REFERENCES "voter"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote" ADD CONSTRAINT "vote_candidate_id_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote" ADD CONSTRAINT "vote_position_id_position_id_fk" FOREIGN KEY ("position_id") REFERENCES "position"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote" ADD CONSTRAINT "vote_election_id_election_id_fk" FOREIGN KEY ("election_id") REFERENCES "election"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
