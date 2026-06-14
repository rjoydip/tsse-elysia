import { relations } from "drizzle-orm";

import { users } from "./users";
import { sessions } from "./sessions";
import { accounts } from "./accounts";
import { mcpApiKeys } from "./mcp-api-keys";
import { permissions } from "./permissions";
import { roles } from "./roles";
import { rolePermissions } from "./rolePermissions";
import { userRoles } from "./userRoles";
import { subscriptions } from "./subscriptions";
import { subscriptionPlans } from "./subscriptionPlans";
import { tasks } from "./tasks";
import { userSettingsProfile } from "./userSettingsProfile";
import { userSettingsAccount } from "./userSettingsAccount";
import { userSettingsDisplay } from "./userSettingsDisplay";
import { userSettingsNotifications } from "./userSettingsNotifications";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  subscriptions: many(subscriptions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const mcpApiKeysRelations = relations(mcpApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [mcpApiKeys.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

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

export const userSettingsProfileRelations = relations(userSettingsProfile, ({ one }) => ({
  user: one(users, {
    fields: [userSettingsProfile.userId],
    references: [users.id],
  }),
}));

export const userSettingsAccountRelations = relations(userSettingsAccount, ({ one }) => ({
  user: one(users, {
    fields: [userSettingsAccount.userId],
    references: [users.id],
  }),
}));

export const userSettingsDisplayRelations = relations(userSettingsDisplay, ({ one }) => ({
  user: one(users, {
    fields: [userSettingsDisplay.userId],
    references: [users.id],
  }),
}));

export const userSettingsNotificationsRelations = relations(
  userSettingsNotifications,
  ({ one }) => ({
    user: one(users, {
      fields: [userSettingsNotifications.userId],
      references: [users.id],
    }),
  }),
);