CREATE TABLE `jarvis_oauth_flows` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`browser_hash` text NOT NULL,
	`verifier` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jarvis_oauth_flows_expiry` ON `jarvis_oauth_flows` (`expires_at`);--> statement-breakpoint
CREATE TABLE `jarvis_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`github_id` text NOT NULL,
	`login` text NOT NULL,
	`display_name` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jarvis_sessions_expiry` ON `jarvis_sessions` (`expires_at`);