/**
 * Auto-generated SQLite schema for "role_permission" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { permissions } from "./permissions";
import { roles } from "./roles";

export const rolePermissions = sqliteTable("role_permission", {
  roleId: text("roleId")
    .notNull()
    .references((): AnySQLiteColumn => roles.id, { onDelete: "cascade" }),
  permissionId: text("permissionId")
    .notNull()
    .references((): AnySQLiteColumn => permissions.id, { onDelete: "cascade" }),
});

export type RolePermissionSelect = typeof rolePermissions.$inferSelect;
export type RolePermissionInsert = typeof rolePermissions.$inferInsert;