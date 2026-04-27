CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`subscriptionTier` text DEFAULT 'free' NOT NULL,
	`subscriptionId` text,
	`subscriptionStatus` text,
	`subscriptionExpiresAt` integer
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `mcp_api_key` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`keyHash` text NOT NULL,
	`userId` text NOT NULL,
	`organizationId` text,
	`permissions` text,
	`rateLimit` integer DEFAULT 100 NOT NULL,
	`rateLimitDuration` integer DEFAULT 60000 NOT NULL,
	`lastUsedAt` integer,
	`expiresAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_api_key_keyHash_unique` ON `mcp_api_key` (`keyHash`);--> statement-breakpoint
CREATE TABLE `service_health` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_name` text NOT NULL,
	`status` text NOT NULL,
	`latency_ms` integer,
	`error` text,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`interval` text NOT NULL,
	`intervalCount` integer DEFAULT 1 NOT NULL,
	`features` text,
	`rateLimit` integer NOT NULL,
	`rateLimitDuration` integer DEFAULT 60000 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`planId` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`currentPeriodStart` integer NOT NULL,
	`currentPeriodEnd` integer NOT NULL,
	`cancelAtPeriodEnd` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`planId`) REFERENCES `subscription_plan`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_settings_account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`dob` integer,
	`language` text DEFAULT 'en' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_settings_display` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`items` text DEFAULT '["recents","home"]' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_settings_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text DEFAULT 'all' NOT NULL,
	`mobile` integer DEFAULT false NOT NULL,
	`communicationEmails` integer DEFAULT false NOT NULL,
	`socialEmails` integer DEFAULT true NOT NULL,
	`marketingEmails` integer DEFAULT false NOT NULL,
	`securityEmails` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_settings_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`username` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`urls` text DEFAULT '[]' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
