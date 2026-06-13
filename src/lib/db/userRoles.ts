/**
 * Auto-generated PostgreSQL schema for "user_role" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, unique } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { users } from "./users";

export const userRoles = pgTable(
  "user_role",
  {
    userId: text("userId")
      .notNull()
      .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
    roleId: text("roleId")
      .notNull()
      .references((): AnyPgColumn => roles.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueConstraint: unique().on(table.userId, table.roleId),
  }),
);

export type UserRoleSelect = typeof userRoles.$inferSelect;
export type UserRoleInsert = typeof userRoles.$inferInsert;