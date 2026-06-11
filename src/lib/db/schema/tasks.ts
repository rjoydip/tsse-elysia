/**
 * Tasks database schema.
 * Defines the tasks table for user task management with soft-delete and archive support.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

/**
 * Tasks table - stores user-created tasks.
 * Supports soft-delete (deletedAt) and archive (archivedAt) states
 * while maintaining a workflow status (backlog, todo, in-progress, review, done, canceled).
 * Archive and delete state is tracked by the archivedAt/deletedAt columns, not by status.
 */
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["backlog", "todo", "in-progress", "review", "done", "canceled"],
  })
    .notNull()
    .default("todo"),
  priority: text("priority", {
    enum: ["low", "medium", "high", "critical"],
  })
    .notNull()
    .default("medium"),
  label: text("label", {
    enum: ["bug", "feature", "documentation"],
  })
    .notNull()
    .default("feature"),
  dueDate: integer("dueDate", { mode: "timestamp" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  assignee: text("assignee"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  archivedAt: integer("archivedAt", { mode: "timestamp" }),
  deletedAt: integer("deletedAt", { mode: "timestamp" }),
});

/**
 * Tasks relations - defines many-to-one relationship to users.
 * Each task belongs to exactly one user.
 */
export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

/**
 * Task type for runtime use (select).
 */
export type Task = typeof tasks.$inferSelect;

/**
 * New task type for inserts.
 */
export type NewTask = typeof tasks.$inferInsert;