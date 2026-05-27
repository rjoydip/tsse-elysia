/**
 * User repository for user management.
 * Handles all ORM (Drizzle) operations for user data.
 */

import { eq, ne, like, and, or, desc, sql, count, inArray } from "drizzle-orm";
import { db as defaultDb } from "~/config/db";
import { users } from "~/lib/db/schema/auth";
import type { DbType } from "~/config/db";

/**
 * Filters for querying users.
 */
export interface UserFilters {
  role?: string;
  /** Array of roles for IN-based filtering (e.g., hierarchy-based visibility) */
  roles?: string[];
  status?: string;
  search?: string;
  /** Exclude a specific user ID (e.g., the currently logged-in user) */
  excludeId?: string;
}

/**
 * Pagination options.
 */
export interface PaginationOptions {
  limit: number;
  offset: number;
}

/**
 * User repository for user management database operations.
 */
export class UserRepository {
  private db: DbType | undefined;

  /**
   * Creates a new UserRepository instance.
   */
  constructor(db?: DbType) {
    // Capture db at construction time for DI/testing, but fall back to live binding
    this.db = db;
  }

  /**
   * Returns the database instance, using the live binding from the db module.
   * This ensures that even if db is initialized asynchronously after this
   * repository is constructed, method calls will still get the initialized db.
   */
  private getDb(): DbType {
    return this.db ?? defaultDb;
  }

  /**
   * Finds all users with optional filtering and pagination.
   */
  async findAll(
    filters?: UserFilters,
    pagination?: PaginationOptions,
  ): Promise<(typeof users.$inferSelect)[]> {
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;

    let query = this.getDb().select().from(users);

    const conditions = [];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    if (filters?.roles && filters.roles.length > 0) {
      conditions.push(inArray(users.role, filters.roles));
    }

    if (filters?.status) {
      conditions.push(eq(users.status, filters.status));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(users.email, searchTerm),
          like(users.name, searchTerm),
          like(users.username, searchTerm),
        ),
      );
    }

    if (filters?.excludeId) {
      conditions.push(ne(users.id, filters.excludeId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(users.createdAt)).limit(limit).offset(offset);

    return results;
  }

  /**
   * Finds a user by ID.
   */
  async findById(id: string): Promise<typeof users.$inferSelect | null> {
    const results = await this.getDb().select().from(users).where(eq(users.id, id)).limit(1);
    return results[0] ?? null;
  }

  /**
   * Finds a user by email.
   */
  async findByEmail(email: string): Promise<typeof users.$inferSelect | null> {
    const results = await this.getDb().select().from(users).where(eq(users.email, email)).limit(1);
    return results[0] ?? null;
  }

  /**
   * Counts total users using SQL COUNT aggregate.
   * Supports optional filters (e.g., role array, excludeId) for pagination accuracy.
   */
  async count(filters?: UserFilters): Promise<number> {
    let query = this.getDb().select({ count: count() }).from(users);

    const conditions = [];

    if (filters?.roles && filters.roles.length > 0) {
      conditions.push(inArray(users.role, filters.roles));
    }

    if (filters?.excludeId) {
      conditions.push(ne(users.id, filters.excludeId));
    }

    if (filters?.status) {
      conditions.push(eq(users.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const [result] = await query;
    return result?.count ?? 0;
  }

  /**
   * Counts users by status.
   * @param status - User status to filter by ("active", "inactive", "suspended", "invited")
   * @returns Count of users with the specified status
   */
  async countByStatus(status: string): Promise<number> {
    const [result] = await this.getDb()
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, status));
    return result?.count ?? 0;
  }

  /**
   * Counts users by role.
   * @param role - User role to filter by ("user", "cashier", "manager", "admin", "superadmin")
   * @returns Count of users with the specified role
   */
  async countByRole(role: string): Promise<number> {
    const [result] = await this.getDb()
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, role));
    return result?.count ?? 0;
  }

  /**
   * Counts users created in the current calendar month (month-to-date).
   * @returns Count of users created since the start of the current month
   */
  async countUsersThisMonth(): Promise<number> {
    const now = new Date();
    // Use UTC to avoid timezone issues
    // Timestamps are stored as Unix seconds (Drizzle mode: "timestamp")
    const monthStart = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), 1) / 1000);
    // Calculate start of next month for upper bound
    const nextMonthStart = Math.floor(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1) / 1000);
    const [result] = await this.getDb()
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${monthStart} AND ${users.createdAt} < ${nextMonthStart}`);
    return result?.count ?? 0;
  }

  /**
   * Retrieves the most recently created users.
   * @param limit - Maximum number of users to return (default: 10)
   * @param role - Optional role filter (e.g., "user" to show only regular users)
   * @returns Array of recent user records
   */
  async findRecent(limit: number = 10, role?: string): Promise<(typeof users.$inferSelect)[]> {
    let query = this.getDb().select().from(users).orderBy(desc(users.createdAt)).limit(limit);

    if (role) {
      query = query.where(eq(users.role, role));
    }

    return query;
  }

  /**
   * Finds users created since a given timestamp (in milliseconds).
   * Uses DB-level filtering instead of fetching all and filtering in-memory.
   * The 'since' parameter is expected in milliseconds (e.g. Date.now() - offset),
   * and is converted to Unix seconds for the database query since timestamps
   * are stored as Unix seconds (Drizzle mode: "timestamp").
   */
  async findRecentSince(
    since: number,
    limit: number = 100,
  ): Promise<(typeof users.$inferSelect)[]> {
    // Convert from milliseconds to Unix seconds for DB comparison
    const sinceInSeconds = Math.floor(since / 1000);
    return this.getDb()
      .select()
      .from(users)
      .where(sql`${users.createdAt} >= ${sinceInSeconds}`)
      .orderBy(desc(users.createdAt))
      .limit(limit);
  }

  /**
   * Counts users updated in the last hour.
   * @returns Count of users updated in the last hour
   */
  async countUsersUpdatedLastHour(): Promise<number> {
    const oneHourAgo = Math.floor((Date.now() - 60 * 60 * 1000) / 1000);
    const [result] = await this.getDb()
      .select({ count: count() })
      .from(users)
      .where(sql`${users.updatedAt} >= ${oneHourAgo}`);
    return result?.count ?? 0;
  }

  /**
   * Gets monthly user registrations for a specific year.
   * Used for yearly comparison chart data.
   */
  async getMonthlyRegistrationsForYear(
    year: number,
  ): Promise<Array<{ name: string; total: number }>> {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = Math.floor(Date.UTC(year, 0, 1) / 1000);
    // Cap current year to the current month; previous years show full year
    const monthCap = year === currentYear ? now.getMonth() + 1 : 12;
    const yearEnd = Math.floor(Date.UTC(year, monthCap, 1) / 1000);

    const rows = await this.getDb()
      .select({
        month: sql`CAST(strftime('%m', ${users.createdAt}, 'unixepoch') AS INTEGER)`.as<number>(),
        count: sql`COUNT(*)`.as<number>(),
      })
      .from(users)
      .where(and(sql`${users.createdAt} >= ${yearStart}`, sql`${users.createdAt} < ${yearEnd}`))
      .groupBy(sql`strftime('%m', ${users.createdAt}, 'unixepoch')`)
      .orderBy(sql`strftime('%m', ${users.createdAt}, 'unixepoch')`);

    const monthMap = new Map<number, number>();
    for (const row of rows) {
      monthMap.set(row.month, row.count);
    }

    return monthNames.slice(0, monthCap).map((name, index) => ({
      name,
      total: monthMap.get(index + 1) ?? 0,
    }));
  }

  /**
   * Gets user registrations grouped by month for chart display.
   * Uses SQLite strftime to extract year-month from unix timestamp.
   * Returns monthly labels ("Jan", "Feb", etc.) with user counts.
   * @returns Array of monthly registration counts for the current year
   */
  async getMonthlyRegistrations(): Promise<Array<{ name: string; total: number }>> {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = Math.floor(Date.UTC(currentYear, 0, 1) / 1000);
    // Cap to start of next month so future months are not included
    const nextMonthStart = Math.floor(Date.UTC(currentYear, now.getMonth() + 1, 1) / 1000);

    const rows = await this.getDb()
      .select({
        month: sql`CAST(strftime('%m', ${users.createdAt}, 'unixepoch') AS INTEGER)`.as<number>(),
        count: sql`COUNT(*)`.as<number>(),
      })
      .from(users)
      .where(
        and(sql`${users.createdAt} >= ${yearStart}`, sql`${users.createdAt} < ${nextMonthStart}`),
      )
      .groupBy(sql`strftime('%m', ${users.createdAt}, 'unixepoch')`)
      .orderBy(sql`strftime('%m', ${users.createdAt}, 'unixepoch')`);

    const monthMap = new Map<number, number>();
    for (const row of rows) {
      monthMap.set(row.month, row.count);
    }

    const monthCount = now.getMonth() + 1;
    return monthNames.slice(0, monthCount).map((name, index) => ({
      name,
      total: monthMap.get(index + 1) ?? 0,
    }));
  }

  /**
   * Gets user counts grouped by role for analytics display.
   * @returns Array of role names with user counts
   */
  async getUsersGroupedByRole(): Promise<Array<{ name: string; value: number }>> {
    const rows: Array<{ name: string | null; value: number }> = await this.getDb()
      .select({
        name: users.role,
        value: sql`COUNT(*)`.as<number>(),
      })
      .from(users)
      .groupBy(users.role)
      .orderBy(sql`COUNT(*)`);

    return rows.map((row) => ({
      name: row.name ?? "user",
      value: row.value,
    }));
  }

  /**
   * Gets user counts grouped by status for analytics display.
   * @returns Array of status names with user counts
   */
  async getUsersGroupedByStatus(): Promise<Array<{ name: string; value: number }>> {
    const rows: Array<{ name: string | null; value: number }> = await this.getDb()
      .select({
        name: users.status,
        value: sql`COUNT(*)`.as<number>(),
      })
      .from(users)
      .groupBy(users.status)
      .orderBy(sql`COUNT(*)`);

    return rows.map((row) => ({
      name: row.name ?? "active",
      value: row.value,
    }));
  }

  /**
   * Updates a user by ID.
   */
  async update(id: string, data: Partial<typeof users.$inferInsert>): Promise<void> {
    await this.getDb().update(users).set(data).where(eq(users.id, id));
  }
}

/**
 * Singleton instance of the user repository.
 */
export const userRepository = new UserRepository();