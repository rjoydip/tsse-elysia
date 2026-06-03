/**
 * Role and Permission schema definitions.
 * Provides database tables for managing custom roles and permissions.
 */

import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

/**
 * Permission table - stores individual permissions.
 * Permissions define specific actions that can be assigned to roles.
 */
export const permissions = sqliteTable("permission", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * Role table - stores custom role definitions.
 * Roles group multiple permissions together for assignment to users.
 */
export const roles = sqliteTable("role", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isDefault: integer("isDefault", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * Role-Permission junction table - many-to-many relationship.
 * Links roles to their assigned permissions.
 */
export const rolePermissions = sqliteTable("role_permission", {
  roleId: text("roleId")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permissionId")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
});

/**
 * User-Role junction table - many-to-many relationship.
 * Links users to their assigned roles from the RBAC roles table.
 */
export const userRoles = sqliteTable(
  "user_role",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("roleId")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userRoleUnique: unique().on(table.userId, table.roleId),
  }),
);

/**
 * Relations - defines relationships between tables.
 */
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

/**
 * Type definitions for runtime use.
 */
export type Permission = typeof permissions.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;

/**
 * Type definitions for inserting new records.
 */
export type NewPermission = typeof permissions.$inferInsert;
export type NewRole = typeof roles.$inferInsert;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type NewUserRole = typeof userRoles.$inferInsert;