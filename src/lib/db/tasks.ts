/**
 * Auto-generated PostgreSQL schema for "tasks" table.
 * DO NOT EDIT — Generated from portable DSL definition.
 */

import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { users } from "./users";

export const tasks_status = pgEnum("tasks_status", [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
  "canceled",
]);
export const tasks_priority = pgEnum("tasks_priority", ["low", "medium", "high", "critical"]);
export const tasks_label = pgEnum("tasks_label", ["bug", "feature", "documentation"]);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: tasks_status("status").notNull().default("todo"),
  priority: tasks_priority("priority").notNull().default("medium"),
  label: tasks_label("label").notNull().default("feature"),
  dueDate: timestamp("dueDate"),
  userId: text("userId")
    .notNull()
    .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  assignee: text("assignee"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  archivedAt: timestamp("archivedAt"),
  deletedAt: timestamp("deletedAt"),
});

export type TaskSelect = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;