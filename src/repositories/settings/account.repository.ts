/**
 * Account settings repository.
 * Handles all ORM (Drizzle) operations for user account settings.
 * All methods return Result types for type-safe error handling.
 */

import { eq } from "drizzle-orm";
import { db as defaultDb } from "~/config/db";
import { nanoid } from "nanoid";
import { users } from "~/lib/db/schema/auth";
import { userSettingsAccount } from "~/lib/db/schema/user-settings";
import { Result, DatabaseError, NotFoundError } from "~/lib/result";
import type { DbType } from "~/config/db";

/**
 * Repository interface for account settings database operations.
 * All methods return Result types with explicit error types.
 */
export interface IAccountRepository {
  findAccountByUserId(
    userId: string,
  ): Promise<Result<typeof userSettingsAccount.$inferSelect, DatabaseError | NotFoundError>>;
  createAccount(data: {
    userId: string;
    name: string;
    dob: Date | null;
    language: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<Result<void, DatabaseError>>;
  updateAccount(
    userId: string,
    data: {
      name: string;
      dob: Date | null;
      language: string;
      updatedAt: Date;
    },
  ): Promise<Result<void, DatabaseError | NotFoundError>>;
  findUserById(
    userId: string,
  ): Promise<Result<{ name: string | null }, DatabaseError | NotFoundError>>;
}

/**
 * Account settings repository implementation using Drizzle ORM.
 * Uses Result types for explicit error handling.
 */
export class AccountRepository implements IAccountRepository {
  private db: DbType | undefined;

  /**
   * Creates a new AccountRepository instance.
   * @param db - Optional database instance (defaults to the global db)
   */
  constructor(db?: DbType) {
    this.db = db;
  }

  /**
   * Returns the database instance using the live binding.
   * This ensures async initialization completes before any method call.
   */
  private getDb(): DbType {
    return this.db ?? defaultDb;
  }

  /**
   * Finds an account by user ID.
   */
  async findAccountByUserId(
    userId: string,
  ): Promise<Result<typeof userSettingsAccount.$inferSelect, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        this.getDb()
          .select()
          .from(userSettingsAccount)
          .where(eq(userSettingsAccount.userId, userId))
          .limit(1),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isError(result)) {
      return Result.err(result.error);
    }

    const records = result.value as any[];
    if (records.length === 0) {
      return Result.err(new NotFoundError({ resource: "Account", id: userId }));
    }

    return Result.ok(records[0]) as Result<
      typeof userSettingsAccount.$inferSelect,
      DatabaseError | NotFoundError
    >;
  }

  /**
   * Creates a new account record.
   */
  async createAccount(data: {
    userId: string;
    name: string;
    dob: Date | null;
    language: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<Result<void, DatabaseError>> {
    return Result.tryPromise({
      try: () =>
        this.getDb().insert(userSettingsAccount).values({
          id: nanoid(),
          userId: data.userId,
          name: data.name,
          dob: data.dob,
          language: data.language,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    }).then((result) => result.andThen(() => Result.ok()));
  }

  /**
   * Updates an existing account record.
   */
  async updateAccount(
    userId: string,
    data: {
      name: string;
      dob: Date | null;
      language: string;
      updatedAt: Date;
    },
  ): Promise<Result<void, DatabaseError | NotFoundError>> {
    // First check if account exists
    const findResult = await this.findAccountByUserId(userId);
    if (Result.isError(findResult)) {
      return Result.err(findResult.error);
    }

    return Result.tryPromise({
      try: () =>
        this.getDb()
          .update(userSettingsAccount)
          .set({
            name: data.name,
            dob: data.dob,
            language: data.language,
            updatedAt: data.updatedAt,
          })
          .where(eq(userSettingsAccount.userId, userId)),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    }).then((result) => result.andThen(() => Result.ok()));
  }

  /**
   * Finds a user by ID (for default values).
   */
  async findUserById(
    userId: string,
  ): Promise<Result<{ name: string | null }, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        this.getDb().select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isOk(result) && (result.value as any[]).length === 0) {
      return Result.err(new NotFoundError({ resource: "User", id: userId }));
    }

    return result.andThen((records: unknown) => {
      const record = (records as any[])[0];
      return Result.ok(record);
    }) as Result<{ name: string | null }, DatabaseError | NotFoundError>;
  }
}

/**
 * Singleton instance of the account repository.
 */
export const accountRepository = new AccountRepository();