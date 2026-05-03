/**
 * Display settings repository.
 * Handles all ORM (Drizzle) operations for user display settings.
 * All methods return Result types for type-safe error handling.
 */

import { eq } from "drizzle-orm";
import { db as defaultDb } from "~/config/db";
import { nanoid } from "nanoid";
import { userSettingsDisplay } from "~/lib/db/schema/user-settings";
import { Result, DatabaseError, NotFoundError } from "~/lib/result";
import type { DbType } from "~/config/db";

/**
 * Repository interface for display settings database operations.
 * All methods return Result types with explicit error types.
 */
export interface IDisplayRepository {
  findDisplayByUserId(
    userId: string,
  ): Promise<Result<typeof userSettingsDisplay.$inferSelect, DatabaseError | NotFoundError>>;
  createDisplay(data: {
    userId: string;
    items: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<Result<void, DatabaseError>>;
  updateDisplay(
    userId: string,
    data: {
      items: string;
      updatedAt: Date;
    },
  ): Promise<Result<void, DatabaseError | NotFoundError>>;
}

/**
 * Display settings repository implementation using Drizzle ORM.
 * Uses Result types for explicit error handling.
 */
export class DisplayRepository implements IDisplayRepository {
  private db: DbType;

  /**
   * Creates a new DisplayRepository instance.
   * @param db - Optional database instance (defaults to the global db)
   */
  constructor(db?: DbType) {
    this.db = db ?? defaultDb;
  }

  /**
   * Finds display settings by user ID.
   */
  async findDisplayByUserId(
    userId: string,
  ): Promise<Result<typeof userSettingsDisplay.$inferSelect, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        this.db
          .select()
          .from(userSettingsDisplay)
          .where(eq(userSettingsDisplay.userId, userId))
          .limit(1),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isError(result)) {
      return result;
    }

    const records = result.value as any[];
    if (records.length === 0) {
      return Result.err(new NotFoundError({ resource: "Display", id: userId }));
    }

    return result.andThen((records: unknown) => {
      const record = (records as any[])[0];
      return Result.ok(record);
    }) as Result<typeof userSettingsDisplay.$inferSelect, DatabaseError | NotFoundError>;
  }

  /**
   * Creates new display settings.
   */
  async createDisplay(data: {
    userId: string;
    items: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<Result<void, DatabaseError>> {
    return Result.tryPromise({
      try: () =>
        this.db.insert(userSettingsDisplay).values({
          id: nanoid(),
          userId: data.userId,
          items: data.items,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    }).then((result) => result.andThen(() => Result.ok()));
  }

  /**
   * Updates existing display settings.
   */
  async updateDisplay(
    userId: string,
    data: {
      items: string;
      updatedAt: Date;
    },
  ): Promise<Result<void, DatabaseError | NotFoundError>> {
    // First check if display settings exist
    const findResult = await this.findDisplayByUserId(userId);
    if (Result.isError(findResult)) {
      return findResult; // Propagate NotFoundError or DatabaseError
    }

    return Result.tryPromise({
      try: () =>
        this.db
          .update(userSettingsDisplay)
          .set({
            items: data.items,
            updatedAt: data.updatedAt,
          })
          .where(eq(userSettingsDisplay.userId, userId)),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    }).then((result) => result.andThen(() => Result.ok()));
  }
}

/**
 * Singleton instance of the display repository.
 */
export const displayRepository = new DisplayRepository();