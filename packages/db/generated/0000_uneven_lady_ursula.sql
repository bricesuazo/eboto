CREATE TABLE `account` (
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` varchar(255),
	`access_token` varchar(255),
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `achievement` (
	`id` varchar(256) NOT NULL,
	`name` text NOT NULL,
	`year` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`credential_id` varchar(256) NOT NULL,
	CONSTRAINT `achievement_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_commissioners_message` (
	`id` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`room_id` varchar(256) NOT NULL,
	`user_id` varchar(256) NOT NULL,
	CONSTRAINT `admin_commissioners_message_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_commissioners_room` (
	`id` varchar(256) NOT NULL,
	`name` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`election_id` varchar(256) NOT NULL,
	CONSTRAINT `admin_commissioners_room_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliation` (
	`id` varchar(256) NOT NULL,
	`org_name` text NOT NULL,
	`org_position` text NOT NULL,
	`start_year` date NOT NULL,
	`end_year` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`credential_id` varchar(256) NOT NULL,
	CONSTRAINT `affiliation_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidate` (
	`id` varchar(256) NOT NULL,
	`slug` varchar(256) NOT NULL,
	`first_name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`image` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`election_id` varchar(256) NOT NULL,
	`credential_id` varchar(256) NOT NULL,
	`position_id` varchar(256) NOT NULL,
	`partylist_id` varchar(256) NOT NULL,
	CONSTRAINT `candidate_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissioner` (
	`id` varchar(256) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`user_id` varchar(256) NOT NULL,
	`election_id` varchar(256) NOT NULL,
	CONSTRAINT `commissioner_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissioners_voters_message` (
	`id` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`room_id` varchar(256) NOT NULL,
	`user_id` varchar(256) NOT NULL,
	CONSTRAINT `commissioners_voters_message_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissioners_voters_room` (
	`id` varchar(256) NOT NULL,
	`name` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`election_id` varchar(256) NOT NULL,
	CONSTRAINT `commissioners_voters_room_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `credential` (
	`id` varchar(256) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`candidate_id` varchar(256) NOT NULL,
	CONSTRAINT `credential_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `deleted_account` (
	`deletedUserId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` varchar(255),
	`access_token` varchar(255),
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `deleted_account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `deleted_user` (
	`id` varchar(256) NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`image_file` json,
	`image` text,
	CONSTRAINT `deleted_user_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`),
	CONSTRAINT `deleted_user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `election` (
	`id` varchar(256) NOT NULL,
	`slug` varchar(256) NOT NULL,
	`name` text NOT NULL,
	`description` longtext,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`voting_hour_start` int NOT NULL DEFAULT 7,
	`voting_hour_end` int NOT NULL DEFAULT 19,
	`publicity` enum('PRIVATE','VOTER','PUBLIC') NOT NULL DEFAULT 'PRIVATE',
	`logo` json,
	`voter_domain` text,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `election_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`),
	CONSTRAINT `election_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `event_attended` (
	`id` varchar(256) NOT NULL,
	`name` text NOT NULL,
	`year` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`credential_id` varchar(256) NOT NULL,
	CONSTRAINT `event_attended_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_election_result` (
	`id` varchar(256) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`election_id` varchar(256) NOT NULL,
	`election` json NOT NULL,
	CONSTRAINT `generated_election_result_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `partylist` (
	`id` varchar(256) NOT NULL,
	`name` text NOT NULL,
	`acronym` text NOT NULL,
	`description` longtext,
	`logo_link` longtext,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`election_id` varchar(256) NOT NULL,
	CONSTRAINT `partylist_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform` (
	`id` varchar(256) NOT NULL,
	`title` text NOT NULL,
	`description` longtext,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`candidate_id` varchar(256) NOT NULL,
	CONSTRAINT `platform_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `position` (
	`id` varchar(256) NOT NULL,
	`name` text NOT NULL,
	`description` longtext,
	`order` int NOT NULL,
	`min` int NOT NULL DEFAULT 0,
	`max` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`election_id` varchar(256) NOT NULL,
	CONSTRAINT `position_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `reported_problem` (
	`id` varchar(256) NOT NULL,
	`subject` longtext NOT NULL,
	`description` longtext NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`election_id` varchar(256) NOT NULL,
	`user_id` varchar(256) NOT NULL,
	CONSTRAINT `reported_problem_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(256) NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`image_file` json,
	`image` text,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification_token` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `verification_token_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
CREATE TABLE `voter_field` (
	`id` varchar(256) NOT NULL,
	`name` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`election_id` varchar(256) NOT NULL,
	CONSTRAINT `voter_field_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `voter` (
	`id` varchar(256) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`email` varchar(256) NOT NULL,
	`field` json,
	`deleted_at` timestamp,
	`election_id` varchar(256) NOT NULL,
	CONSTRAINT `voter_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `vote` (
	`id` varchar(256) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`voter_id` varchar(256) NOT NULL,
	`candidate_id` varchar(256),
	`position_id` varchar(256),
	`election_id` varchar(256) NOT NULL,
	CONSTRAINT `vote_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE INDEX `achievementId_idx` ON `achievement` (`id`);--> statement-breakpoint
CREATE INDEX `achievementCredentialId_idx` ON `achievement` (`credential_id`);--> statement-breakpoint
CREATE INDEX `commissionersVotersMessageId_idx` ON `admin_commissioners_message` (`id`);--> statement-breakpoint
CREATE INDEX `commissionersVotersMessageRoomId_idx` ON `admin_commissioners_message` (`room_id`);--> statement-breakpoint
CREATE INDEX `commissionersVotersMessageUserId_idx` ON `admin_commissioners_message` (`user_id`);--> statement-breakpoint
CREATE INDEX `commissionersVotersRoomId_idx` ON `admin_commissioners_room` (`id`);--> statement-breakpoint
CREATE INDEX `commissionersVotersRoomElectionId_idx` ON `admin_commissioners_room` (`election_id`);--> statement-breakpoint
CREATE INDEX `affiliationId_idx` ON `affiliation` (`id`);--> statement-breakpoint
CREATE INDEX `affiliationCredentialId_idx` ON `affiliation` (`credential_id`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidate` (`id`);--> statement-breakpoint
CREATE INDEX `candidateSlug_idx` ON `candidate` (`slug`);--> statement-breakpoint
CREATE INDEX `candidateElectionId_idx` ON `candidate` (`election_id`);--> statement-breakpoint
CREATE INDEX `candidateCredentialId_idx` ON `candidate` (`credential_id`);--> statement-breakpoint
CREATE INDEX `candidatePositionId_idx` ON `candidate` (`position_id`);--> statement-breakpoint
CREATE INDEX `candidatePartylistId_idx` ON `candidate` (`partylist_id`);--> statement-breakpoint
CREATE INDEX `commissionerId_idx` ON `commissioner` (`id`);--> statement-breakpoint
CREATE INDEX `commissionerElectionId_idx` ON `commissioner` (`election_id`);--> statement-breakpoint
CREATE INDEX `commissionerUserId_idx` ON `commissioner` (`user_id`);--> statement-breakpoint
CREATE INDEX `commissionerUserIdElectionId_idx` ON `commissioner` (`user_id`,`election_id`);--> statement-breakpoint
CREATE INDEX `commissionerDeletedAt_idx` ON `commissioner` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `commissionersVotersMessageId_idx` ON `commissioners_voters_message` (`id`);--> statement-breakpoint
CREATE INDEX `commissionersVotersMessageRoomId_idx` ON `commissioners_voters_message` (`room_id`);--> statement-breakpoint
CREATE INDEX `commissionersVotersMessageUserId_idx` ON `commissioners_voters_message` (`user_id`);--> statement-breakpoint
CREATE INDEX `commissionersVotersRoomId_idx` ON `commissioners_voters_room` (`id`);--> statement-breakpoint
CREATE INDEX `commissionersVotersRoomElectionId_idx` ON `commissioners_voters_room` (`election_id`);--> statement-breakpoint
CREATE INDEX `credentialId_idx` ON `credential` (`id`);--> statement-breakpoint
CREATE INDEX `credentialCandidateId_idx` ON `credential` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `deletedAccount_deletedUserId_idx` ON `deleted_account` (`deletedUserId`);--> statement-breakpoint
CREATE INDEX `deletedUserId_idx` ON `deleted_user` (`id`);--> statement-breakpoint
CREATE INDEX `deletedUserEmail_idx` ON `deleted_user` (`email`);--> statement-breakpoint
CREATE INDEX `electionId_idx` ON `election` (`id`);--> statement-breakpoint
CREATE INDEX `electionSlug_idx` ON `election` (`slug`);--> statement-breakpoint
CREATE INDEX `electionStartDate_idx` ON `election` (`start_date`);--> statement-breakpoint
CREATE INDEX `electionEndDate_idx` ON `election` (`end_date`);--> statement-breakpoint
CREATE INDEX `electionVotingHourStart_idx` ON `election` (`voting_hour_start`);--> statement-breakpoint
CREATE INDEX `electionVotingHourEnd_idx` ON `election` (`voting_hour_end`);--> statement-breakpoint
CREATE INDEX `electionDeletedAt_idx` ON `election` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `eventAttendedId_idx` ON `event_attended` (`id`);--> statement-breakpoint
CREATE INDEX `eventAttendedCredentialId_idx` ON `event_attended` (`credential_id`);--> statement-breakpoint
CREATE INDEX `generatedElectionResultId_idx` ON `generated_election_result` (`id`);--> statement-breakpoint
CREATE INDEX `generatedElectionResultElectionId_idx` ON `generated_election_result` (`election_id`);--> statement-breakpoint
CREATE INDEX `partylistId_idx` ON `partylist` (`id`);--> statement-breakpoint
CREATE INDEX `partylistElectionId_idx` ON `partylist` (`election_id`);--> statement-breakpoint
CREATE INDEX `platformId_idx` ON `platform` (`id`);--> statement-breakpoint
CREATE INDEX `platformCandidateId_idx` ON `platform` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `positionId_idx` ON `position` (`id`);--> statement-breakpoint
CREATE INDEX `positionElectionId_idx` ON `position` (`election_id`);--> statement-breakpoint
CREATE INDEX `reportedProblemId_idx` ON `reported_problem` (`id`);--> statement-breakpoint
CREATE INDEX `reportedProblemElectionId_idx` ON `reported_problem` (`election_id`);--> statement-breakpoint
CREATE INDEX `reportedProblemUserId_idx` ON `reported_problem` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessionUserId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `sessionToken_idx` ON `session` (`sessionToken`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `user` (`id`);--> statement-breakpoint
CREATE INDEX `userEmail_idx` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `voterFieldId_idx` ON `voter_field` (`id`);--> statement-breakpoint
CREATE INDEX `voterFieldElectionId_idx` ON `voter_field` (`election_id`);--> statement-breakpoint
CREATE INDEX `voterId_idx` ON `voter` (`id`);--> statement-breakpoint
CREATE INDEX `voterEmail_idx` ON `voter` (`email`);--> statement-breakpoint
CREATE INDEX `voterElectionId_idx` ON `voter` (`election_id`);--> statement-breakpoint
CREATE INDEX `voteId_idx` ON `vote` (`id`);--> statement-breakpoint
CREATE INDEX `voteVoterId_idx` ON `vote` (`voter_id`);--> statement-breakpoint
CREATE INDEX `voteCandidateId_idx` ON `vote` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `votePositionId_idx` ON `vote` (`position_id`);--> statement-breakpoint
CREATE INDEX `voteElectionId_idx` ON `vote` (`election_id`);