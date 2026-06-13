/**
 * Database schema barrel — exports all tables, relations, and types.
 * Each table file is a hand-authored pgTable definition.
 * Relations and user-facing types are maintained manually.
 */

// Auto-generated table exports
export { accounts, type AccountSelect, type AccountInsert } from "./accounts";
export { mcpApiKeys, type McpApiKeySelect, type McpApiKeyInsert } from "./mcpApiKeys";
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
  permissionsRelations,
  rolesRelations,
  rolePermissionsRelations,
  userRolesRelations,
  userSettingsProfileRelations,
  userSettingsAccountRelations,
  userSettingsDisplayRelations,
  userSettingsNotificationsRelations,
} from "./relations";

// User-facing type aliases
export type {
  User,
  Session,
  Account,
  Verification,
  McpApiKey,
  ServiceHealth,
  SubscriptionPlan,
  Subscription,
  Task,
  NewTask,
  UserSettingsProfile,
  UserSettingsAccount,
  UserSettingsDisplay,
  UserSettingsNotifications,
  Permission,
  Role,
  RolePermission,
  UserRole,
  NewPermission,
  NewRole,
  NewRolePermission,
  NewUserRole,
} from "./types";