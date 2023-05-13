CREATE TABLE `posts` (
	`id` serial AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`user_id` serial AUTO_INCREMENT NOT NULL,
	`created_at` timestamp(2) NOT NULL DEFAULT (now()));
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `full_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `clerk_id` varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` timestamp(2) DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `phone`;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_index` ON `users` (`clerk_id`);