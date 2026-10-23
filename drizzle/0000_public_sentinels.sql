CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`interest` text NOT NULL,
	`message` text NOT NULL,
	`consent` integer NOT NULL,
	`payload_hash` text NOT NULL,
	`received_at` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inquiries_reference_unique` ON `inquiries` (`reference`);--> statement-breakpoint
CREATE INDEX `inquiries_received_idx` ON `inquiries` (`received_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limits_expiry_idx` ON `rate_limits` (`expires_at`);