/**
 * Account settings repository.
 * Handles all ORM (Drizzle) operations for user account settings.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "~/config/db";
import { nanoid } from "nanoid";

/**
 * Repository interface for account settings database operations.
 */
export interface IAccountRepository {
  findAccountByUserId(
    userId: string,
  ): Promise<typeof schema.userSettingsAccount.$inferSelect | undefined>;
  createAccount(data: {
    userId: string;
    name: string;
    dob: Date | null;
    language: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<void>;
  updateAccount(
    userId: string,
    data: {
      name: string;
      dob: Date | null;
      language: string;
      updatedAt: Date;
    },
  ): Promise<void>;
  findUserById(userId: string): Promise<{ name: string | null } | undefined>;
}

/**
 * Account settings repository implementation using Drizzle ORM.
 */
export class AccountRepository implements IAccountRepository {
  /**
   * Finds an account by user ID.
   */
  async findAccountByUserId(
    userId: string,
  ): Promise<typeof schema.userSettingsAccount.$inferSelect | undefined> {
    const [account] = await db
      .select()
      .from(schema.userSettingsAccount)
      .where(eq(schema.userSettingsAccount.userId, userId))
      .limit(1);
    return account;
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
  }): Promise<void> {
    await db.insert(schema.userSettingsAccount).values({
      id: nanoid(),
      userId: data.userId,
      name: data.name,
      dob: data.dob,
      language: data.language,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
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
  ): Promise<void> {
    await db
      .update(schema.userSettingsAccount)
      .set({
        name: data.name,
        dob: data.dob,
        language: data.language,
        updatedAt: data.updatedAt,
      })
      .where(eq(schema.userSettingsAccount.userId, userId));
  }

  /**
   * Finds a user by ID (for default values).
   */
  async findUserById(userId: string): Promise<{ name: string | null } | undefined> {
    const [user] = await db
      .select({ name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    return user;
  }
}

/**
 * Singleton instance of the account repository.
 */
export const accountRepository = new AccountRepository();