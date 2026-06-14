/**
 * Auto-generated PostgreSQL schema for "role_permission" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { permissions } from "./permissions";
import { roles } from "./roles";

export const rolePermissions = pgTable(
  "role_permission",
  {
    roleId: text("roleId")
      .notNull()
      .references((): AnyPgColumn => roles.id, { onDelete: "cascade" }),
    permissionId: text("permissionId")
      .notNull()
      .references((): AnyPgColumn => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
);

export type RolePermissionSelect = typeof rolePermissions.$inferSelect;
export type RolePermissionInsert = typeof rolePermissions.$inferInsert;