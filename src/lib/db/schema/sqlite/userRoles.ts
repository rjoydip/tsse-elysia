/**
 * Auto-generated SQLite schema for "user_role" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { roles } from "./roles";
import { users } from "./users";

export const userRoles = sqliteTable(
  "user_role",
  {
    userId: text("userId")
      .notNull()
      .references((): AnySQLiteColumn => users.id, { onDelete: "cascade" }),
    roleId: text("roleId")
      .notNull()
      .references((): AnySQLiteColumn => roles.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueConstraint: unique().on(table.userId, table.roleId),
  }),
);

export type UserRoleSelect = typeof userRoles.$inferSelect;
export type UserRoleInsert = typeof userRoles.$inferInsert;