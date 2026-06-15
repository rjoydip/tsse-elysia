ALTER TABLE "service_health" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_roleId_permissionId_pk" PRIMARY KEY("roleId","permissionId");