ALTER TABLE `posts` MODIFY COLUMN `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `posts` DROP FOREIGN KEY `posts_user_id_users_id_fk`;
