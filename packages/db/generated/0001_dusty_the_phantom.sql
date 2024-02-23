CREATE TABLE `election_plus` (
	`id` varchar(256) NOT NULL,
	`user_id` varchar(256) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`redeemed_at` timestamp,
	CONSTRAINT `election_plus_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` varchar(256) NOT NULL,
	`name` text NOT NULL,
	CONSTRAINT `product_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `variant` (
	`id` varchar(256) NOT NULL,
	`name` text NOT NULL,
	`price` int NOT NULL,
	`product_id` varchar(256) NOT NULL,
	CONSTRAINT `variant_id` PRIMARY KEY(`id`),
	CONSTRAINT `variant_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `election` MODIFY COLUMN `description` text NOT NULL DEFAULT ('');--> statement-breakpoint
ALTER TABLE `partylist` MODIFY COLUMN `description` text NOT NULL DEFAULT ('');--> statement-breakpoint
ALTER TABLE `partylist` MODIFY COLUMN `logo_link` text;--> statement-breakpoint
ALTER TABLE `platform` MODIFY COLUMN `description` text NOT NULL DEFAULT ('');--> statement-breakpoint
ALTER TABLE `position` MODIFY COLUMN `description` text NOT NULL DEFAULT ('');--> statement-breakpoint
ALTER TABLE `reported_problem` MODIFY COLUMN `subject` text NOT NULL;--> statement-breakpoint
ALTER TABLE `reported_problem` MODIFY COLUMN `description` text NOT NULL;--> statement-breakpoint
ALTER TABLE `election` ADD `is_candidates_visible_in_realtime_when_ongoing` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `election` ADD `name_arrangement` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `election` ADD `variant_id` varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE `generated_election_result` ADD `result` json NOT NULL;--> statement-breakpoint
CREATE INDEX `electionPlusId_idx` ON `election_plus` (`id`);--> statement-breakpoint
CREATE INDEX `electionPlusUserId_idx` ON `election_plus` (`user_id`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `product` (`id`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `variant` (`id`);--> statement-breakpoint
ALTER TABLE `generated_election_result` DROP COLUMN `election`;