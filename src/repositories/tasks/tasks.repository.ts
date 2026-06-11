/**
 * Tasks repository.
 * Handles all ORM (Drizzle) operations for tasks with soft-delete and archive support.
 * Uses lazy getDb() pattern for HMR safety and client-side import isolation.
 */

import { randomUUID } from "uncrypto";
import { eq, and, desc, gte, lt, sql, isNull, inArray } from "drizzle-orm";
import type { DbType } from "~/config/db";
import { monthFromTimestamp } from "~/repositories/tasks/date-helpers";

/**
 * Task status values used in the workflow.
 */
export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
  "canceled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Task priority values.
 */
export const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * Task label values.
 */
export const TASK_LABELS = ["bug", "feature", "documentation"] as const;
export type TaskLabel = (typeof TASK_LABELS)[number];

import type { tasks as TasksTable, Task as TaskRow } from "~/lib/db/schema/tasks";

export type { TaskRow };

/**
 * Filter parameters for listing tasks.
 */
export interface TaskFilters {
  status?: string[];
  priority?: string[];
  label?: string[];
  search?: string;
  includeArchived?: boolean;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Monthly task count for chart data.
 */
export interface MonthlyTaskCount {
  month: number;
  created: number;
  completed: number;
  archived: number;
}

/**
 * Task stats for the dashboard overview.
 */
export interface TaskStats {
  total: number;
  active: number;
  archived: number;
  deleted: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  backlog: number;
  canceled: number;
}

/**
 * Tasks repository interface.
 */
export interface ITasksRepository {
  findAll(userId: string, filters?: TaskFilters): Promise<{ tasks: TaskRow[]; total: number }>;
  findById(id: string, userId: string): Promise<TaskRow | null>;
  create(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    label?: string;
    dueDate?: Date;
    userId: string;
    assignee?: string;
  }): Promise<TaskRow>;
  update(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      description: string | null;
      status: string;
      priority: string;
      label: string;
      dueDate: number | null;
      assignee: string | null;
      createdAt: number;
      updatedAt: number;
      archivedAt: number | null;
      deletedAt: number | null;
    }>,
  ): Promise<TaskRow | null>;
  archive(id: string, userId: string): Promise<TaskRow | null>;
  unarchive(id: string, userId: string): Promise<TaskRow | null>;
  softDelete(id: string, userId: string): Promise<TaskRow | null>;
  stats(userId: string): Promise<TaskStats>;
  getMonthlyCounts(userId: string, year: number): Promise<MonthlyTaskCount[]>;
}

/**
 * Tasks repository implementation using Drizzle ORM.
 */
export class TasksRepository implements ITasksRepository {
  private _db: DbType | null = null;
  private _tasksTable: typeof TasksTable | null = null;

  /**
   * Creates a new TasksRepository instance.
   * Optional db parameter for DI/testing with mock db.
   */
  constructor(db?: DbType, tasksTable?: typeof TasksTable) {
    if (db) this._db = db;
    if (tasksTable) this._tasksTable = tasksTable;
  }

  /** Cached init promise to fire each dynamic import at most once. */
  private _initPromise: Promise<{ db: DbType; tasksTable: typeof TasksTable }> | null = null;

  /**
   * Lazy initializer for db to avoid HMR issues and client-side imports.
   * Caches the promise so the dynamic import fires only once per instance.
   */
  private async init(): Promise<{ db: DbType; tasksTable: typeof TasksTable }> {
    if (!this._initPromise) {
      this._initPromise = (async () => {
        if (!this._db) {
          const dbModule = await import("~/config/db");
          this._db = dbModule.db as DbType;
        }
        if (!this._tasksTable) {
          const schemaModule = await import("~/lib/db/schema/tasks");
          this._tasksTable = schemaModule.tasks as typeof TasksTable;
        }
        return { db: this._db, tasksTable: this._tasksTable };
      })();
    }
    return this._initPromise;
  }

  /**
   * Finds all tasks for a user with optional filters.
   * Excludes soft-deleted and archived tasks by default.
   */
  async findAll(
    userId: string,
    filters?: TaskFilters,
  ): Promise<{ tasks: TaskRow[]; total: number }> {
    const { db, tasksTable } = await this.init();

    const conditions: ReturnType<typeof eq>[] = [eq(tasksTable.userId, userId)];

    // By default exclude deleted and archived unless explicitly requested
    if (!filters?.includeDeleted) {
      conditions.push(isNull(tasksTable.deletedAt));
    }
    if (!filters?.includeArchived) {
      conditions.push(isNull(tasksTable.archivedAt));
    }

    if (filters?.status?.length) {
      conditions.push(inArray(tasksTable.status, filters.status as any));
    }
    if (filters?.priority?.length) {
      conditions.push(inArray(tasksTable.priority, filters.priority as any));
    }
    if (filters?.label?.length) {
      conditions.push(inArray(tasksTable.label, filters.label as any));
    }
    if (filters?.search) {
      conditions.push(sql`${tasksTable.title} LIKE ${`%${filters.search}%`}`);
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const [tasksResult, countResult] = await Promise.all([
      db
        .select()
        .from(tasksTable)
        .where(and(...conditions))
        .orderBy(desc(tasksTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(tasksTable)
        .where(and(...conditions)),
    ]);

    return {
      tasks: tasksResult,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  /**
   * Finds a single task by id for a specific user (ownership check).
   */
  async findById(id: string, userId: string): Promise<TaskRow | null> {
    const { db, tasksTable } = await this.init();

    const result = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Creates a new task.
   */
  async create(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    label?: string;
    dueDate?: Date;
    userId: string;
    assignee?: string;
  }): Promise<TaskRow> {
    const { db, tasksTable } = await this.init();
    const now = new Date();

    const [record] = await db
      .insert(tasksTable)
      .values({
        id: randomUUID(),
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? "todo",
        priority: data.priority ?? "medium",
        label: data.label ?? "feature",
        dueDate: data.dueDate ?? null,
        userId: data.userId,
        assignee: data.assignee ?? null,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        deletedAt: null,
      })
      .returning();

    return record;
  }

  /**
   * Updates a task (ownership check enforced).
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      description: string | null;
      status: string;
      priority: string;
      label: string;
      dueDate: number | null;
      assignee: string | null;
      createdAt: number;
      updatedAt: number;
      archivedAt: number | null;
      deletedAt: number | null;
    }>,
  ): Promise<TaskRow | null> {
    const { db, tasksTable } = await this.init();
    const now = new Date();

    const [record] = await db
      .update(tasksTable)
      .set({ ...data, updatedAt: now })
      .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)))
      .returning();

    return record ?? null;
  }

  /**
   * Shared helper: sets a timestamp column on a task and returns the updated row.
   * Reduces the 6-line update+where+returning pattern to a single call.
   */
  private async _updateTimestamp(
    id: string,
    userId: string,
    column: "archivedAt" | "deletedAt",
    value: Date | null,
  ): Promise<TaskRow | null> {
    const { db, tasksTable } = await this.init();
    const now = new Date();

    const [record] = await db
      .update(tasksTable)
      .set({ [column]: value, updatedAt: now })
      .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)))
      .returning();

    return record ?? null;
  }

  /**
   * Archives a task by setting archivedAt timestamp.
   */
  async archive(id: string, userId: string): Promise<TaskRow | null> {
    return this._updateTimestamp(id, userId, "archivedAt", new Date());
  }

  /**
   * Unarchives a task by clearing archivedAt.
   * Preserves the task's original workflow status (doesn't reset to "todo").
   */
  async unarchive(id: string, userId: string): Promise<TaskRow | null> {
    return this._updateTimestamp(id, userId, "archivedAt", null);
  }

  /**
   * Soft-deletes a task by setting deletedAt timestamp.
   */
  async softDelete(id: string, userId: string): Promise<TaskRow | null> {
    return this._updateTimestamp(id, userId, "deletedAt", new Date());
  }

  /**
   * Returns aggregate stats for a user's tasks.
   */
  async stats(userId: string): Promise<TaskStats> {
    const { db, tasksTable } = await this.init();

    const isArchived = sql<number>`CASE WHEN ${tasksTable.archivedAt} IS NOT NULL THEN 1 ELSE 0 END`;
    const isDeleted = sql<number>`CASE WHEN ${tasksTable.deletedAt} IS NOT NULL THEN 1 ELSE 0 END`;

    const rows = await db
      .select({
        status: tasksTable.status,
        isArchived,
        isDeleted,
        count: sql<number>`count(*)`,
      })
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId))
      .groupBy(tasksTable.status, isArchived, isDeleted);

    const result: TaskStats = {
      total: 0,
      active: 0,
      archived: 0,
      deleted: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      backlog: 0,
      canceled: 0,
    };

    for (const row of rows) {
      const count = Number(row.count);
      result.total += count;

      if (row.isDeleted) {
        result.deleted += count;
      } else if (row.isArchived) {
        result.archived += count;
      } else {
        result.active += count;
        switch (row.status) {
          case "todo":
            result.todo += count;
            break;
          case "in-progress":
            result.inProgress += count;
            break;
          case "review":
            result.review += count;
            break;
          case "done":
            result.done += count;
            break;
          case "backlog":
            result.backlog += count;
            break;
          case "canceled":
            result.canceled += count;
            break;
          default:
            // Unknown status — counted in active but not in any status bucket
            break;
        }
      }
    }

    return result;
  }

  /**
   * Returns monthly task counts (created, completed, archived) for a given year.
   */
  async getMonthlyCounts(userId: string, year: number): Promise<MonthlyTaskCount[]> {
    const { db, tasksTable } = await this.init();

    // Use Date boundaries for comparison; Drizzle converts to the appropriate
    // native type per dialect (unix-epoch integer for SQLite, TIMESTAMP for PG).
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    // Build the month SQL expression once (dialect-agnostic)
    const createdAtMonth = await monthFromTimestamp(tasksTable.createdAt);
    const updatedAtMonth = await monthFromTimestamp(tasksTable.updatedAt);
    const archivedAtMonth = await monthFromTimestamp(tasksTable.archivedAt);

    // Get created tasks per month
    const createdRows = await db
      .select({
        month: createdAtMonth,
        count: sql<number>`count(*)`,
      })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.userId, userId),
          gte(tasksTable.createdAt, yearStart),
          lt(tasksTable.createdAt, yearEnd),
        ),
      )
      .groupBy(createdAtMonth);

    // Get completed tasks per month
    const completedRows = await db
      .select({
        month: updatedAtMonth,
        count: sql<number>`count(*)`,
      })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.userId, userId),
          eq(tasksTable.status, "done"),
          gte(tasksTable.updatedAt, yearStart),
          lt(tasksTable.updatedAt, yearEnd),
        ),
      )
      .groupBy(updatedAtMonth);

    // Get archived tasks per month
    const archivedRows = await db
      .select({
        month: archivedAtMonth,
        count: sql<number>`count(*)`,
      })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.userId, userId),
          gte(tasksTable.archivedAt, yearStart),
          lt(tasksTable.archivedAt, yearEnd),
        ),
      )
      .groupBy(archivedAtMonth);

    // Build a complete 12-month result
    const months: MonthlyTaskCount[] = [];
    for (let m = 1; m <= 12; m++) {
      months.push({
        month: m,
        created: Number(createdRows.find((r: { month: number }) => r.month === m)?.count ?? 0),
        completed: Number(completedRows.find((r: { month: number }) => r.month === m)?.count ?? 0),
        archived: Number(archivedRows.find((r: { month: number }) => r.month === m)?.count ?? 0),
      });
    }

    return months;
  }
}

/**
 * Singleton instance of the tasks repository.
 */
export const tasksRepository = new TasksRepository();