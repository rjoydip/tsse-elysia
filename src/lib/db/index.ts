/**
 * Database schema barrel — exports all tables, relations, and types.
 * Each table file is a hand-authored pgTable definition.
 * Relations and user-facing types are maintained manually.
 */

// Auto-generated table exports
export { accounts, type AccountSelect, type AccountInsert } from "./accounts";
export { mcpApiKeys, type McpApiKeySelect, type McpApiKeyInsert } from "./mcp-api-keys";
export { permissions, type PermissionSelect, type PermissionInsert } from "./permissions";
export { roles, type RoleSelect, type RoleInsert } from "./roles";
export {
  rolePermissions,
  type RolePermissionSelect,
  type RolePermissionInsert,
} from "./rolePermissions";
export { serviceHealth, type ServiceHealthSelect, type ServiceHealthInsert } from "./serviceHealth";
export { sessions, type SessionSelect, type SessionInsert } from "./sessions";
export {
  subscriptionPlans,
  type SubscriptionPlanSelect,
  type SubscriptionPlanInsert,
} from "./subscriptionPlans";
export { subscriptions, type SubscriptionSelect, type SubscriptionInsert } from "./subscriptions";
export { tasks, type TaskSelect, type TaskInsert } from "./tasks";
export { userRoles, type UserRoleSelect, type UserRoleInsert } from "./userRoles";
export { users, type UserSelect, type UserInsert } from "./users";
export {
  userSettingsAccount,
  type UserSettingsAccountSelect,
  type UserSettingsAccountInsert,
} from "./userSettingsAccount";
export {
  userSettingsDisplay,
  type UserSettingsDisplaySelect,
  type UserSettingsDisplayInsert,
} from "./userSettingsDisplay";
export {
  userSettingsNotifications,
  type UserSettingsNotificationSelect,
  type UserSettingsNotificationInsert,
} from "./userSettingsNotifications";
export {
  userSettingsProfile,
  type UserSettingsProfileSelect,
  type UserSettingsProfileInsert,
} from "./userSettingsProfile";
export { verifications, type VerificationSelect, type VerificationInsert } from "./verifications";

// Relations
export {
  usersRelations,
  sessionsRelations,
  accountsRelations,
  mcpApiKeysRelations,
  tasksRelations,
  subscriptionsRelations,
  subscriptionPlansRelations,
  permissionsRelations,
  rolesRelations,
  rolePermissionsRelations,
  userRolesRelations,
  userSettingsProfileRelations,
  userSettingsAccountRelations,
  userSettingsDisplayRelations,
  userSettingsNotificationsRelations,
} from "./relations";

// Friendly aliases for commonly-used db row types
// (consumers may also import *Select/*Insert directly from the barrel)
// Direct import needed for `typeof` — re-exports are not referencable in type positions.
import { mcpApiKeys } from "./mcp-api-keys";
import { tasks } from "./tasks";
import { permissions } from "./permissions";
import { roles } from "./roles";
import { userRoles } from "./userRoles";

export type McpApiKey = typeof mcpApiKeys.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;