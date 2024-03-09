DROP INDEX `commissionerUserId_idx` ON `commissioner`;--> statement-breakpoint
DROP INDEX `sessionToken_idx` ON `session`;--> statement-breakpoint
ALTER TABLE `achievement` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `admin_commissioners_message` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `admin_commissioners_room` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `affiliation` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `candidate` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `commissioner` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `commissioners_voters_message` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `commissioners_voters_room` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `credential` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `deleted_user` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `election` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `election_plus` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `event_attended` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `generated_election_result` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `partylist` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `platform` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `position` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `reported_problem` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `user` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `voter_field` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `voter` DROP INDEX `election_id_unique`;--> statement-breakpoint
ALTER TABLE `vote` DROP INDEX `election_id_unique`;