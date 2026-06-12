/**
 * Database schema loader.
 * Re-exports all tables, relations, and types from the dialect-specific schema.
 *
 * All tables are generated from portable DSL definitions via the code generator.
 * Relations and type aliases are maintained manually in each submodule proxy file.
 *
 * @see scripts/generate-schema.ts
 */

// Auth schema
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

// Subscriptions schema
export {
  subscriptionPlans,
  subscriptions,
  usersSubscriptionsRelations,
  subscriptionsRelations,
  type SubscriptionPlan,
  type Subscription,
} from "./subscriptions";

// MCP schema
export {
  mcpApiKeys,
  serviceHealth,
  mcpApiKeysRelations,
  type McpApiKey,
  type ServiceHealth,
} from "./mcp";

// User settings schema
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