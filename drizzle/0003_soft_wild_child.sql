CREATE TABLE `user_role` (
	`userId` text NOT NULL,
	`roleId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_role_userId_roleId_unique` ON `user_role` (`userId`,`roleId`);