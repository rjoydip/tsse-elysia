/**
 * Auto-generated SQLite schema for "tasks" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["backlog", "todo", "in-progress", "review", "done", "canceled"] })
    .notNull()
    .default("todo"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] })
    .notNull()
    .default("medium"),
  label: text("label", { enum: ["bug", "feature", "documentation"] })
    .notNull()
    .default("feature"),
  dueDate: integer("dueDate", { mode: "timestamp" }),
  userId: text("userId")
    .notNull()
    .references((): AnySQLiteColumn => users.id, { onDelete: "cascade" }),
  assignee: text("assignee"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  archivedAt: integer("archivedAt", { mode: "timestamp" }),
  deletedAt: integer("deletedAt", { mode: "timestamp" }),
});

export type TaskSelect = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;