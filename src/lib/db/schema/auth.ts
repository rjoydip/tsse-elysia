/**
 * Auth schema — proxy re-exporting generated SQLite tables with relations.
 * Tables are generated from portable DSL definitions.
 */

import { relations } from "drizzle-orm";

import { users } from "./sqlite/users";
import { sessions } from "./sqlite/sessions";
import { accounts } from "./sqlite/accounts";
import { verifications } from "./sqlite/verifications";

export { users, sessions, accounts, verifications };

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
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

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Verification = typeof verifications.$inferSelect;