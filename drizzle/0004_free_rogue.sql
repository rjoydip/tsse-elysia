CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text NOT NULL DEFAULT 'todo',
	`priority` text NOT NULL DEFAULT 'medium',
	`label` text NOT NULL DEFAULT 'feature',
	`dueDate` integer,
	`userId` text NOT NULL,
	`assignee` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`archivedAt` integer,
	`deletedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
