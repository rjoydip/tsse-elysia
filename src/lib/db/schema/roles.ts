/**
 * Roles schema — proxy re-exporting generated SQLite tables with relations.
 * Tables are generated from portable DSL definitions.
 */

import { relations } from "drizzle-orm";

import { users } from "./sqlite/users";
import { permissions } from "./sqlite/permissions";
import { roles } from "./sqlite/roles";
import { rolePermissions } from "./sqlite/rolePermissions";
import { userRoles } from "./sqlite/userRoles";

export { permissions, roles, rolePermissions, userRoles };

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

export type Permission = typeof permissions.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;

export type NewPermission = typeof permissions.$inferInsert;
export type NewRole = typeof roles.$inferInsert;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type NewUserRole = typeof userRoles.$inferInsert;