/**
 * DSL definitions for RBAC tables (permission, role, rolePermission, userRole).
 * Single source of truth for roles and permissions schema.
 */

import { defineTable, uid, text, timestamp, boolean as bool } from "./builder";

/**
 * Permission table - stores individual permissions.
 */
export const permission = defineTable("permissions", "permission", {
  id: uid(),
  name: { ...text(), notNull: true, unique: true },
  description: text(),
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
});

/**
 * Role table - stores custom role definitions.
 */
export const role = defineTable("roles", "role", {
  id: uid(),
  name: { ...text(), notNull: true, unique: true },
  description: text(),
  isDefault: { ...bool(), notNull: true, defaultValue: false },
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
});

/**
 * Role-Permission junction table - many-to-many relationship.
 */
export const rolePermission = defineTable("rolePermissions", "role_permission", {
  roleId: {
    ...text(),
    notNull: true,
    references: { table: "roles", column: "id", onDelete: "cascade" },
  },
  permissionId: {
    ...text(),
    notNull: true,
    references: { table: "permissions", column: "id", onDelete: "cascade" },
  },
});

/**
 * User-Role junction table - many-to-many relationship.
 * Links users to their assigned roles from the RBAC roles table.
 */
export const userRole = defineTable(
  "userRoles",
  "user_role",
  {
    userId: {
      ...text(),
      notNull: true,
      references: { table: "users", column: "id", onDelete: "cascade" },
    },
    roleId: {
      ...text(),
      notNull: true,
      references: { table: "roles", column: "id", onDelete: "cascade" },
    },
  },
  {
    unique: [{ columns: ["userId", "roleId"] }],
  },
);