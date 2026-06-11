CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`label` text DEFAULT 'feature' NOT NULL,
	`dueDate` integer,
	`userId` text NOT NULL,
	`assignee` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`archivedAt` integer,
	`deletedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
