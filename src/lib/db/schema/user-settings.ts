/**
 * User settings schema — proxy re-exporting generated SQLite tables with relations.
 * Tables are generated from portable DSL definitions.
 */

import { relations } from "drizzle-orm";

import { users } from "./sqlite/users";
import { userSettingsProfile } from "./sqlite/userSettingsProfile";
import { userSettingsAccount } from "./sqlite/userSettingsAccount";
import { userSettingsDisplay } from "./sqlite/userSettingsDisplay";
import { userSettingsNotifications } from "./sqlite/userSettingsNotifications";

export { userSettingsProfile, userSettingsAccount, userSettingsDisplay, userSettingsNotifications };

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

export type UserSettingsProfile = typeof userSettingsProfile.$inferSelect;
export type UserSettingsAccount = typeof userSettingsAccount.$inferSelect;
export type UserSettingsDisplay = typeof userSettingsDisplay.$inferSelect;
export type UserSettingsNotifications = typeof userSettingsNotifications.$inferSelect;