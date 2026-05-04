/**
 * User repository for user management.
 * Handles all ORM (Drizzle) operations for user data.
 */

import { eq, like, and, or, desc } from "drizzle-orm";
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
   * Counts total users.
   */
  async count(): Promise<number> {
    const result = await this.db.select({ count: users.id }).from(users);
    return result.length;
  }
}

/**
 * Singleton instance of the user repository.
 */
export const userRepository = new UserRepository();