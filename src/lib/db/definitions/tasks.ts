/**
 * DSL definitions for tasks table.
 * Single source of truth for tasks schema.
 */

import { defineTable, uid, text, timestamp, enum_ } from "./builder";

/**
 * Tasks table - stores user-created tasks.
 * Supports soft-delete (deletedAt) and archive (archivedAt) states.
 */
export const task = defineTable("tasks", "tasks", {
  id: uid(),
  title: { ...text(), notNull: true },
  description: text(),
  status: {
    ...enum_(["backlog", "todo", "in-progress", "review", "done", "canceled"] as const),
    notNull: true,
    defaultValue: "todo",
  },
  priority: {
    ...enum_(["low", "medium", "high", "critical"] as const),
    notNull: true,
    defaultValue: "medium",
  },
  label: {
    ...enum_(["bug", "feature", "documentation"] as const),
    notNull: true,
    defaultValue: "feature",
  },
  dueDate: timestamp(),
  userId: {
    ...text(),
    notNull: true,
    references: { table: "users", column: "id", onDelete: "cascade" },
  },
  assignee: text(),
  createdAt: { ...timestamp(), notNull: true },
  updatedAt: { ...timestamp(), notNull: true },
  archivedAt: timestamp(),
  deletedAt: timestamp(),
});