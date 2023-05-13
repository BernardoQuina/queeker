DROP INDEX `unique_index` ON `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_username` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_clerk_id` ON `users` (`clerk_id`);