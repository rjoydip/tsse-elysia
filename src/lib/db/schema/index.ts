/**
 * Database schema index.
 * Aggregates all schema definitions for easy importing.
 */

// Auth schema (users, sessions, accounts, verifications)
export {
  users,
  sessions,
  accounts,
  verifications,
  usersRelations,
  sessionsRelations,
  accountsRelations,
  type User,
  type Session,
  type Account,
  type Verification,
} from "./auth";

// Subscriptions schema (subscriptionPlans, subscriptions)
export {
  subscriptionPlans,
  subscriptions,
  usersSubscriptionsRelations,
  subscriptionsRelations,
  type SubscriptionPlan,
  type Subscription,
} from "./subscriptions";

// MCP schema (mcpApiKeys, serviceHealth)
export {
  mcpApiKeys,
  serviceHealth,
  mcpApiKeysRelations,
  type McpApiKey,
  type ServiceHealth,
} from "./mcp";

// User settings schema (profile, account, display, notifications)
export {
  userSettingsProfile,
  userSettingsAccount,
  userSettingsDisplay,
  userSettingsNotifications,
  userSettingsProfileRelations,
  userSettingsAccountRelations,
  userSettingsDisplayRelations,
  userSettingsNotificationsRelations,
  type UserSettingsProfile,
  type UserSettingsAccount,
  type UserSettingsDisplay,
  type UserSettingsNotifications,
} from "./user-settings";

// Tasks schema
export { tasks, tasksRelations, type Task, type NewTask } from "./tasks";

// Role and Permission schema
export {
  permissions,
  roles,
  rolePermissions,
  userRoles,
  permissionsRelations,
  rolesRelations,
  rolePermissionsRelations,
  userRolesRelations,
  type Permission,
  type Role,
  type RolePermission,
  type UserRole,
  type NewPermission,
  type NewRole,
  type NewRolePermission,
  type NewUserRole,
} from "./roles";