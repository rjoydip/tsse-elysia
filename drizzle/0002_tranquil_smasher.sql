ALTER TABLE "user_role" DROP CONSTRAINT "user_role_userId_roleId_unique";--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_userId_roleId_pk" PRIMARY KEY("userId","roleId");