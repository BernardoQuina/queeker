ALTER TABLE `users` RENAME COLUMN `full_name` TO `display_name`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `display_name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `image` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `clerk_id`;--> statement-breakpoint