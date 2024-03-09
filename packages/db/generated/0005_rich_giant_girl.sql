DROP INDEX `achievementId_idx` ON `achievement`;--> statement-breakpoint
DROP INDEX `affiliationId_idx` ON `affiliation`;--> statement-breakpoint
DROP INDEX `candidateId_idx` ON `candidate`;--> statement-breakpoint
DROP INDEX `commissionerId_idx` ON `commissioner`;--> statement-breakpoint
DROP INDEX `credentialId_idx` ON `credential`;--> statement-breakpoint
DROP INDEX `deletedUserId_idx` ON `deleted_user`;--> statement-breakpoint
DROP INDEX `deletedUserEmail_idx` ON `deleted_user`;--> statement-breakpoint
DROP INDEX `electionId_idx` ON `election`;--> statement-breakpoint
DROP INDEX `electionPlusId_idx` ON `election_plus`;--> statement-breakpoint
DROP INDEX `eventAttendedId_idx` ON `event_attended`;--> statement-breakpoint
DROP INDEX `generatedElectionResultId_idx` ON `generated_election_result`;--> statement-breakpoint
DROP INDEX `partylistId_idx` ON `partylist`;--> statement-breakpoint
DROP INDEX `platformId_idx` ON `platform`;--> statement-breakpoint
DROP INDEX `positionId_idx` ON `position`;--> statement-breakpoint
DROP INDEX `productId_idx` ON `product`;--> statement-breakpoint
DROP INDEX `reportedProblemId_idx` ON `reported_problem`;--> statement-breakpoint
DROP INDEX `userId_idx` ON `user`;--> statement-breakpoint
DROP INDEX `userEmail_idx` ON `user`;--> statement-breakpoint
DROP INDEX `productId_idx` ON `variant`;--> statement-breakpoint
DROP INDEX `voterFieldId_idx` ON `voter_field`;--> statement-breakpoint
DROP INDEX `voterId_idx` ON `voter`;--> statement-breakpoint
DROP INDEX `voteId_idx` ON `vote`;--> statement-breakpoint
ALTER TABLE `product` DROP INDEX `product_id_unique`;--> statement-breakpoint
ALTER TABLE `variant` DROP INDEX `variant_id_unique`;--> statement-breakpoint
CREATE INDEX `reportedProblemElectionIdUserId_idx` ON `reported_problem` (`election_id`,`user_id`);