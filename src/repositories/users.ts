/**
 * User repository for user management.
 * Handles all ORM (Drizzle) operations for user data.
 */

import { eq, like, and, or, desc, sql, count } from "drizzle-orm";
import { db as defaultDb } from "~/config/db";
import { users } from "~/lib/db/schema/auth";
import type { DbType } from "~/config/db";

/**
 * Filters for querying users.
 */
export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
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
  private db: DbType;

  /**
   * Creates a new UserRepository instance.
   */
  constructor(db?: DbType) {
    this.db = db ?? defaultDb;
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

    let query = this.db.select().from(users);

    const conditions = [];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
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
    const results = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0] ?? null;
  }

  /**
   * Finds a user by email.
   */
  async findByEmail(email: string): Promise<typeof users.$inferSelect | null> {
    const results = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return results[0] ?? null;
  }

  /**
   * Counts total users using SQL COUNT aggregate.
   * Note: Drizzle's { count: users.id } translates to SQL COUNT(users.id) internally.
   * This is the most efficient approach available in Drizzle ORM.
   */
  async count(): Promise<number> {
    const [result] = await this.db.select({ count: count() }).from(users);
    return result?.count ?? 0;
  }

  /**
   * Counts users by status.
   * @param status - User status to filter by ("active", "inactive", "suspended", "invited")
   * @returns Count of users with the specified status
   */
  async countByStatus(status: string): Promise<number> {
    const [result] = await this.db
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
    const [result] = await this.db
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
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const [result] = await this.db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${monthStart}`);
    return result?.count ?? 0;
  }

  /**
   * Retrieves the most recently created users.
   * @param limit - Maximum number of users to return (default: 10)
   * @returns Array of recent user records
   */
  async findRecent(limit: number = 10): Promise<(typeof users.$inferSelect)[]> {
    return this.db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
  }

  /**
   * Finds users created since a given timestamp.
   * Uses DB-level filtering instead of fetching all and filtering in-memory.
   */
  async findRecentSince(
    since: number,
    limit: number = 100,
  ): Promise<(typeof users.$inferSelect)[]> {
    return this.db
      .select()
      .from(users)
      .where(sql`${users.createdAt} >= ${since}`)
      .orderBy(desc(users.createdAt))
      .limit(limit);
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

    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();

    const rows = await this.db
      .select({
        month:
          sql`CAST(strftime('%m', ${users.createdAt} / 1000, 'unixepoch') AS INTEGER)`.as<number>(),
        count: sql`COUNT(*)`.as<number>(),
      })
      .from(users)
      .where(and(sql`${users.createdAt} >= ${yearStart}`, sql`${users.createdAt} <= ${yearEnd}`))
      .groupBy(sql`strftime('%m', ${users.createdAt} / 1000, 'unixepoch')`)
      .orderBy(sql`strftime('%m', ${users.createdAt} / 1000, 'unixepoch')`);

    const monthMap = new Map<number, number>();
    for (const row of rows) {
      monthMap.set(row.month, row.count);
    }

    return monthNames.map((name, index) => ({
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

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1).getTime();
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59).getTime();

    const rows = await this.db
      .select({
        month:
          sql`CAST(strftime('%m', ${users.createdAt} / 1000, 'unixepoch') AS INTEGER)`.as<number>(),
        count: sql`COUNT(*)`.as<number>(),
      })
      .from(users)
      .where(and(sql`${users.createdAt} >= ${yearStart}`, sql`${users.createdAt} <= ${yearEnd}`))
      .groupBy(sql`strftime('%m', ${users.createdAt} / 1000, 'unixepoch')`)
      .orderBy(sql`strftime('%m', ${users.createdAt} / 1000, 'unixepoch')`);

    const monthMap = new Map<number, number>();
    for (const row of rows) {
      monthMap.set(row.month, row.count);
    }

    return monthNames.map((name, index) => ({
      name,
      total: monthMap.get(index + 1) ?? 0,
    }));
  }

  /**
   * Gets user counts grouped by role for analytics display.
   * @returns Array of role names with user counts
   */
  async getUsersGroupedByRole(): Promise<Array<{ name: string; value: number }>> {
    const rows: Array<{ name: string | null; value: number }> = await this.db
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
    const rows: Array<{ name: string | null; value: number }> = await this.db
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
    await this.db.update(users).set(data).where(eq(users.id, id));
  }
}

/**
 * Singleton instance of the user repository.
 */
export const userRepository = new UserRepository();