/**
 * Profile settings repository.
 * Handles all ORM (Drizzle) operations for user profile settings.
 * All methods return Result types for type-safe error handling.
 */

import { eq } from "drizzle-orm";
import { db } from "~/config/db";
import { nanoid } from "nanoid";
import { userSettingsProfile } from "~/lib/db";
import { users } from "~/lib/db";
import { Result, DatabaseError, NotFoundError } from "~/lib/result";

/**
 * Repository interface for profile settings database operations.
 * All methods return Result types with explicit error types.
 */
export interface IProfileRepository {
  findProfileByUserId(
    userId: string,
  ): Promise<Result<typeof userSettingsProfile.$inferSelect, DatabaseError | NotFoundError>>;
  createProfile(data: {
    userId: string;
    username: string;
    email: string;
    bio: string;
    urls: string;
  }): Promise<Result<void, DatabaseError>>;
  updateProfile(
    userId: string,
    data: {
      username: string;
      bio: string;
      urls: string;
      updatedAt: Date;
    },
  ): Promise<Result<void, DatabaseError | NotFoundError>>;
  findUserById(
    userId: string,
  ): Promise<Result<{ name: string | null; email: string | null }, DatabaseError | NotFoundError>>;
}

/**
 * Profile settings repository implementation using Drizzle ORM.
 * Uses Result types for explicit error handling.
 */
export class ProfileRepository implements IProfileRepository {
  /**
   * Finds a profile by user ID.
   */
  async findProfileByUserId(
    userId: string,
  ): Promise<Result<typeof userSettingsProfile.$inferSelect, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        db
          .select()
          .from(userSettingsProfile)
          .where(eq(userSettingsProfile.userId, userId))
          .limit(1),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isOk(result) && (!result.value || (result.value as any[]).length === 0)) {
      return Result.err(new NotFoundError({ resource: "Profile", id: userId }));
    }

    return result.andThen((records: unknown) => {
      const record = (records as any[])[0];
      return Result.ok(record);
    }) as Result<typeof userSettingsProfile.$inferSelect, DatabaseError | NotFoundError>;
  }

  /**
   * Creates a new profile record.
   */
  async createProfile(data: {
    userId: string;
    username: string;
    email: string;
    bio: string;
    urls: string;
  }): Promise<Result<void, DatabaseError>> {
    const now = new Date();
    return Result.tryPromise({
      try: () =>
        db.insert(userSettingsProfile).values({
          id: nanoid(),
          userId: data.userId,
          username: data.username,
          email: data.email,
          bio: data.bio,
          urls: data.urls,
          createdAt: now,
          updatedAt: now,
        }),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    }).then((result) => result.andThen(() => Result.ok()));
  }

  /**
   * Updates an existing profile record.
   */
  async updateProfile(
    userId: string,
    data: {
      username: string;
      bio: string;
      urls: string;
      updatedAt: Date;
    },
  ): Promise<Result<void, DatabaseError | NotFoundError>> {
    // First check if profile exists
    const findResult = await this.findProfileByUserId(userId);
    if (Result.isError(findResult)) {
      return Result.err(findResult.error);
    }

    return Result.tryPromise({
      try: () =>
        db
          .update(userSettingsProfile)
          .set({
            username: data.username,
            bio: data.bio,
            urls: data.urls,
            updatedAt: data.updatedAt,
          })
          .where(eq(userSettingsProfile.userId, userId)),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    }).then((result) => result.andThen(() => Result.ok()));
  }

  /**
   * Finds a user by ID (for default values).
   */
  async findUserById(
    userId: string,
  ): Promise<Result<{ name: string | null; email: string | null }, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isOk(result) && (!result.value || (result.value as any[]).length === 0)) {
      return Result.err(new NotFoundError({ resource: "User", id: userId }));
    }

    return result.andThen((records: unknown) => {
      const record = (records as any[])[0];
      return Result.ok(record);
    }) as Result<{ name: string | null; email: string | null }, DatabaseError | NotFoundError>;
  }
}

/**
 * Singleton instance of the profile repository.
 */
export const profileRepository = new ProfileRepository();