DROP INDEX `commissionersVotersMessageId_idx` ON `admin_commissioners_message`;--> statement-breakpoint
DROP INDEX `commissionersVotersMessageRoomId_idx` ON `admin_commissioners_message`;--> statement-breakpoint
DROP INDEX `commissionersVotersMessageUserId_idx` ON `admin_commissioners_message`;--> statement-breakpoint
DROP INDEX `commissionersVotersRoomId_idx` ON `admin_commissioners_room`;--> statement-breakpoint
DROP INDEX `commissionersVotersRoomElectionId_idx` ON `admin_commissioners_room`;--> statement-breakpoint
DROP INDEX `commissionersVotersMessageId_idx` ON `commissioners_voters_message`;--> statement-breakpoint
DROP INDEX `commissionersVotersMessageRoomId_idx` ON `commissioners_voters_message`;--> statement-breakpoint
DROP INDEX `commissionersVotersMessageUserId_idx` ON `commissioners_voters_message`;--> statement-breakpoint
DROP INDEX `commissionersVotersRoomId_idx` ON `commissioners_voters_room`;--> statement-breakpoint
DROP INDEX `commissionersVotersRoomElectionId_idx` ON `commissioners_voters_room`;--> statement-breakpoint
DROP INDEX `credentialCandidateId_idx` ON `credential`;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `userId` varchar(256) NOT NULL;--> statement-breakpoint
CREATE INDEX `ACM_CVMRI_idx` ON `admin_commissioners_message` (`room_id`);--> statement-breakpoint
CREATE INDEX `ACM_CVMUI_idx` ON `admin_commissioners_message` (`user_id`);--> statement-breakpoint
CREATE INDEX `ACR_CVREI_idx` ON `admin_commissioners_room` (`election_id`);--> statement-breakpoint
CREATE INDEX `CVM_CVMRI_idx` ON `commissioners_voters_message` (`room_id`);--> statement-breakpoint
CREATE INDEX `CVM_CVMUI_idx` ON `commissioners_voters_message` (`user_id`);--> statement-breakpoint
CREATE INDEX `CVR_CVREI_idx` ON `commissioners_voters_room` (`election_id`);--> statement-breakpoint
CREATE INDEX `electionVariantId_idx` ON `election` (`variant_id`);--> statement-breakpoint
ALTER TABLE `achievement` ADD CONSTRAINT `achievement_credential_id_credential_id_fk` FOREIGN KEY (`credential_id`) REFERENCES `credential`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_commissioners_message` ADD CONSTRAINT `admin_commissioners_message_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_commissioners_message` ADD CONSTRAINT `ACM_RoomReference` FOREIGN KEY (`room_id`) REFERENCES `admin_commissioners_room`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_commissioners_room` ADD CONSTRAINT `admin_commissioners_room_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliation` ADD CONSTRAINT `affiliation_credential_id_credential_id_fk` FOREIGN KEY (`credential_id`) REFERENCES `credential`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate` ADD CONSTRAINT `candidate_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate` ADD CONSTRAINT `candidate_credential_id_credential_id_fk` FOREIGN KEY (`credential_id`) REFERENCES `credential`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate` ADD CONSTRAINT `candidate_position_id_position_id_fk` FOREIGN KEY (`position_id`) REFERENCES `position`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate` ADD CONSTRAINT `candidate_partylist_id_partylist_id_fk` FOREIGN KEY (`partylist_id`) REFERENCES `partylist`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commissioner` ADD CONSTRAINT `commissioner_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commissioner` ADD CONSTRAINT `commissioner_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commissioners_voters_message` ADD CONSTRAINT `commissioners_voters_message_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commissioners_voters_message` ADD CONSTRAINT `CVM_RoomReference` FOREIGN KEY (`room_id`) REFERENCES `commissioners_voters_room`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commissioners_voters_room` ADD CONSTRAINT `commissioners_voters_room_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `election` ADD CONSTRAINT `election_variant_id_variant_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `variant`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `election_plus` ADD CONSTRAINT `election_plus_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_attended` ADD CONSTRAINT `event_attended_credential_id_credential_id_fk` FOREIGN KEY (`credential_id`) REFERENCES `credential`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `generated_election_result` ADD CONSTRAINT `generated_election_result_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partylist` ADD CONSTRAINT `partylist_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platform` ADD CONSTRAINT `platform_candidate_id_candidate_id_fk` FOREIGN KEY (`candidate_id`) REFERENCES `candidate`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `position` ADD CONSTRAINT `position_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reported_problem` ADD CONSTRAINT `reported_problem_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reported_problem` ADD CONSTRAINT `reported_problem_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `variant` ADD CONSTRAINT `variant_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `voter_field` ADD CONSTRAINT `voter_field_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `voter` ADD CONSTRAINT `voter_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vote` ADD CONSTRAINT `vote_voter_id_voter_id_fk` FOREIGN KEY (`voter_id`) REFERENCES `voter`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vote` ADD CONSTRAINT `vote_candidate_id_candidate_id_fk` FOREIGN KEY (`candidate_id`) REFERENCES `candidate`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vote` ADD CONSTRAINT `vote_position_id_position_id_fk` FOREIGN KEY (`position_id`) REFERENCES `position`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vote` ADD CONSTRAINT `vote_election_id_election_id_fk` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credential` DROP COLUMN `candidate_id`;