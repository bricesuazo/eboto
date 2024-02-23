ALTER TABLE `election` MODIFY COLUMN `variant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `product` MODIFY COLUMN `id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `variant` MODIFY COLUMN `id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `variant` MODIFY COLUMN `product_id` int NOT NULL;