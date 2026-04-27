/**
 * Database schema re-exports.
 * Provides unified access to all schema modules.
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

// User Settings schema
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