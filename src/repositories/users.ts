/**
 * User repository for user management.
 * Handles all ORM (Drizzle) operations for user data.
 */

import { eq, ne, like, and, or, desc, sql, count, inArray } from "drizzle-orm";
import { db as defaultDb } from "~/config/db";
import { users } from "~/lib/db";
import { userRoles, roles, rolePermissions, permissions } from "~/lib/db";
import { roleHierarchy, type UserRole } from "~/lib/auth/permissions";
import { MONTH_NAMES } from "~/config/date";
import type { DbType } from "~/config/db";

/**
 * Type for monthly registration data.
 */
interface MonthlyRow {
  month: number;
  count: number;
}

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
   * Builds a monthly registration array from raw DB rows.
   * Fills gaps with zero and slices to monthCap.
   */
  private static buildMonthlyData(
    rows: MonthlyRow[],
    monthCap: number,
  ): Array<{ name: string; total: number }> {
    const monthMap = new Map<number, number>();
    for (const row of rows) {
      monthMap.set(row.month, row.count);
    }
    return MONTH_NAMES.slice(0, monthCap).map((name, index) => ({
      name,
      total: monthMap.get(index + 1) ?? 0,
    }));
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
   * @param role - User role to filter by ("user", "cashier", "manager", "admin")
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
    // Use UTC Date objects for PG timestamp columns
    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
    const [result] = await this.getDb()
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${monthStart} AND ${users.createdAt} < ${nextMonthStart}`);
    return result?.count ?? 0;
  }

  /**
   * Retrieves the most recently created users with optional pagination.
   * @param limit - Maximum number of users to return (default: 10)
   * @param role - Optional role filter (e.g., "user" to show only regular users)
   * @param offset - Optional number of records to skip (for pagination)
   * @returns Array of recent user records
   */
  async findRecent(
    limit: number = 10,
    role?: string,
    offset?: number,
  ): Promise<(typeof users.$inferSelect)[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (role) {
      conditions.push(eq(users.role, role));
    }

    let query = this.getDb().select().from(users);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const safeOffset = typeof offset === "number" && offset > 0 ? offset : 0;
    query = query.orderBy(desc(users.createdAt)).limit(limit).offset(safeOffset);

    return query;
  }

  /**
   * Finds users created since a given timestamp.
   * The 'since' parameter is expected in milliseconds (e.g. Date.now() - offset),
   * and is converted to a Date object for PG timestamp comparison.
   */
  async findRecentSince(
    since: number,
    limit: number = 100,
  ): Promise<(typeof users.$inferSelect)[]> {
    return this.getDb()
      .select()
      .from(users)
      .where(sql`${users.createdAt} >= ${new Date(since)}`)
      .orderBy(desc(users.createdAt))
      .limit(limit);
  }

  /**
   * Counts users updated in the last hour.
   * @returns Count of users updated in the last hour
   */
  async countUsersUpdatedLastHour(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [result] = await this.getDb()
      .select({ count: count() })
      .from(users)
      .where(sql`${users.updatedAt} >= ${oneHourAgo}`);
    return result?.count ?? 0;
  }

  /**
   * Shared monthly registration query for a date range.
   * Extracts month number and count from users created within the given range.
   */
  async getMonthlyRows(yearStart: Date, yearEnd: Date): Promise<MonthlyRow[]> {
    return this.getDb()
      .select({
        month: sql`EXTRACT(MONTH FROM ${users.createdAt})::INTEGER`.as<number>(),
        count: sql`COUNT(*)`.as<number>(),
      })
      .from(users)
      .where(and(sql`${users.createdAt} >= ${yearStart}`, sql`${users.createdAt} < ${yearEnd}`))
      .groupBy(sql`EXTRACT(MONTH FROM ${users.createdAt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${users.createdAt})`);
  }

  /**
   * Gets monthly user registrations for a specific year.
   * Used for yearly comparison chart data.
   */
  async getMonthlyRegistrationsForYear(
    year: number,
  ): Promise<Array<{ name: string; total: number }>> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    // Cap current year to the current month; previous years show full year
    const monthCap = year === currentYear ? now.getMonth() + 1 : 12;
    const yearEnd = new Date(Date.UTC(year, monthCap, 1));

    const rows = await this.getMonthlyRows(yearStart, yearEnd);
    return UserRepository.buildMonthlyData(rows, monthCap);
  }

  /**
   * Gets user registrations grouped by month for chart display.
   * Uses EXTRACT(MONTH FROM ...) for PG timestamp columns.
   * Returns monthly labels ("Jan", "Feb", etc.) with user counts.
   * @returns Array of monthly registration counts for the current year
   */
  async getMonthlyRegistrations(): Promise<Array<{ name: string; total: number }>> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthCap = now.getMonth() + 1;

    // Calculate year start and next month start for querying
    const yearStart = new Date(Date.UTC(currentYear, 0, 1));
    const nextMonthStart = new Date(Date.UTC(currentYear, monthCap, 1));

    const rows = await this.getMonthlyRows(yearStart, nextMonthStart);
    return UserRepository.buildMonthlyData(rows, monthCap);
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

  // ---- User-Role convenience methods ----

  /**
   * Assigns a role to a user via the user_role junction table.
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    const existing = await this.getDb()
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .limit(1);

    if (existing.length === 0) {
      await this.getDb().insert(userRoles).values({ userId, roleId });
    }
  }

  /**
   * Removes a role from a user.
   */
  async removeUserRole(userId: string, roleId: string): Promise<void> {
    await this.getDb()
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }

  /**
   * Gets all role records assigned to a user.
   */
  async getUserRoles(userId: string): Promise<(typeof roles.$inferSelect)[]> {
    const records: Array<{
      user_role: typeof userRoles.$inferSelect;
      role: typeof roles.$inferSelect;
    }> = await this.getDb()
      .select()
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    return records.map((r: { role: typeof roles.$inferSelect }) => r.role);
  }

  /**
   * Resolves the user's effective highest role from the userRoles junction table.
   *
   * The userRoles table is the source of truth for role assignments. Users may
   * have multiple roles (e.g. both "user" and "admin"). This method returns
   * the highest-ranked role name according to the roleHierarchy.
   *
   * Falls back to users.role (the denormalized column) if the user has no
   * entries in the userRoles junction table.
   *
   * @param userId - The user's ID
   * @returns The user's effective highest role, or "user" if no role found
   */
  async getEffectiveRole(userId: string): Promise<UserRole> {
    const userRolesList = await this.getUserRoles(userId);

    if (userRolesList.length > 0) {
      // Find the highest-ranked role from the junction table
      let highestRole: UserRole = "user";
      let highestLevel = -1;

      for (const role of userRolesList) {
        const level = roleHierarchy[role.name as UserRole] ?? -1;
        if (level > highestLevel) {
          highestLevel = level;
          highestRole = role.name as UserRole;
        }
      }

      if (highestLevel >= 0) {
        return highestRole;
      }
    }

    // Fallback: read the denormalized users.role column
    const user = await this.getDb()
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows: { role: string | null }[]) => rows[0]);

    return (user?.role as UserRole) ?? "user";
  }

  /**
   * Gets all permission names assigned to a user via their roles.
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const records: Array<{ permissionName: string | null }> = await this.getDb()
      .select({ permissionName: permissions.name })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));
    return [
      ...new Set(
        records
          .map((r: { permissionName: string | null }) => r.permissionName ?? "")
          .filter(Boolean),
      ),
    ];
  }
}

/**
 * Singleton instance of the user repository.
 */
export const userRepository = new UserRepository();