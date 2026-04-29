/**
 * Profile settings repository.
 * Handles all ORM (Drizzle) operations for user profile settings.
 */

import { eq } from "drizzle-orm";
import { db } from "~/config/db";
import { nanoid } from "nanoid";
import { userSettingsProfile } from "~/lib/db/schema/user-settings";
import { users } from "~/lib/db/schema/auth";

/**
 * Repository interface for profile settings database operations.
 */
export interface IProfileRepository {
  findProfileByUserId(userId: string): Promise<typeof userSettingsProfile.$inferSelect | undefined>;
  createProfile(data: {
    userId: string;
    username: string;
    email: string;
    bio: string;
    urls: string;
  }): Promise<void>;
  updateProfile(
    userId: string,
    data: {
      username: string;
      bio: string;
      urls: string;
      updatedAt: Date;
    },
  ): Promise<void>;
  findUserById(userId: string): Promise<{ name: string | null; email: string | null } | undefined>;
}

/**
 * Profile settings repository implementation using Drizzle ORM.
 */
export class ProfileRepository implements IProfileRepository {
  /**
   * Finds a profile by user ID.
   */
  async findProfileByUserId(
    userId: string,
  ): Promise<typeof userSettingsProfile.$inferSelect | undefined> {
    const [profile] = await db
      .select()
      .from(userSettingsProfile)
      .where(eq(userSettingsProfile.userId, userId))
      .limit(1);
    return profile;
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
  }): Promise<void> {
    const now = new Date();
    await db.insert(userSettingsProfile).values({
      id: nanoid(),
      userId: data.userId,
      username: data.username,
      email: data.email,
      bio: data.bio,
      urls: data.urls,
      createdAt: now,
      updatedAt: now,
    });
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
  ): Promise<void> {
    await db
      .update(userSettingsProfile)
      .set({
        username: data.username,
        bio: data.bio,
        urls: data.urls,
        updatedAt: data.updatedAt,
      })
      .where(eq(userSettingsProfile.userId, userId));
  }

  /**
   * Finds a user by ID (for default values).
   */
  async findUserById(
    userId: string,
  ): Promise<{ name: string | null; email: string | null } | undefined> {
    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user;
  }
}

/**
 * Singleton instance of the profile repository.
 */
export const profileRepository = new ProfileRepository();