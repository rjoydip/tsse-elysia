/**
 * Notifications settings repository.
 * Handles all ORM (Drizzle) operations for user notification settings.
 * All methods return Result types for type-safe error handling.
 */

import { eq } from "drizzle-orm";
import { db } from "~/config/db";
import { nanoid } from "nanoid";
import { userSettingsNotifications } from "~/lib/db/schema/user-settings";
import { Result, DatabaseError, NotFoundError } from "~/lib/result";

/**
 * Repository interface for notifications settings database operations.
 * All methods return Result types with explicit error types.
 */
export interface INotificationsRepository {
  findNotificationsByUserId(
    userId: string,
  ): Promise<Result<typeof userSettingsNotifications.$inferSelect, DatabaseError | NotFoundError>>;
  createNotifications(data: {
    userId: string;
    type: string;
    mobile: boolean;
    communicationEmails: boolean;
    socialEmails: boolean;
    marketingEmails: boolean;
    securityEmails: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<Result<void, DatabaseError>>;
  updateNotifications(
    userId: string,
    data: {
      type: string;
      mobile: boolean;
      communicationEmails: boolean;
      socialEmails: boolean;
      marketingEmails: boolean;
      securityEmails: boolean;
      updatedAt: Date;
    },
  ): Promise<Result<void, DatabaseError | NotFoundError>>;
}

/**
 * Notifications settings repository implementation using Drizzle ORM.
 * Uses Result types for explicit error handling.
 */
export class NotificationsRepository implements INotificationsRepository {
  /**
   * Finds notification settings by user ID.
   */
  async findNotificationsByUserId(
    userId: string,
  ): Promise<Result<typeof userSettingsNotifications.$inferSelect, DatabaseError | NotFoundError>> {
    const result = await Result.tryPromise({
      try: () =>
        db
          .select()
          .from(userSettingsNotifications)
          .where(eq(userSettingsNotifications.userId, userId))
          .limit(1),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    });

    if (Result.isOk(result) && (result.value as any[]).length === 0) {
      return Result.err(new NotFoundError({ resource: "Notifications", id: userId }));
    }

    return result.andThen((records: unknown) => {
      const record = (records as any[])[0];
      return Result.ok(record);
    }) as Result<typeof userSettingsNotifications.$inferSelect, DatabaseError | NotFoundError>;
  }

  /**
   * Creates new notification settings.
   */
  async createNotifications(data: {
    userId: string;
    type: string;
    mobile: boolean;
    communicationEmails: boolean;
    socialEmails: boolean;
    marketingEmails: boolean;
    securityEmails: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<Result<void, DatabaseError>> {
    return Result.tryPromise({
      try: () =>
        db.insert(userSettingsNotifications).values({
          id: nanoid(),
          userId: data.userId,
          type: data.type,
          mobile: data.mobile,
          communicationEmails: data.communicationEmails,
          socialEmails: data.socialEmails,
          marketingEmails: data.marketingEmails,
          securityEmails: data.securityEmails,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    }).then((result) => result.andThen(() => Result.ok()));
  }

  /**
   * Updates existing notification settings.
   */
  async updateNotifications(
    userId: string,
    data: {
      type: string;
      mobile: boolean;
      communicationEmails: boolean;
      socialEmails: boolean;
      marketingEmails: boolean;
      securityEmails: boolean;
      updatedAt: Date;
    },
  ): Promise<Result<void, DatabaseError | NotFoundError>> {
    // First check if notifications settings exist
    const findResult = await this.findNotificationsByUserId(userId);
    if (Result.isError(findResult)) {
      return findResult; // Propagate NotFoundError or DatabaseError
    }

    return Result.tryPromise({
      try: () =>
        db
          .update(userSettingsNotifications)
          .set({
            type: data.type,
            mobile: data.mobile,
            communicationEmails: data.communicationEmails,
            socialEmails: data.socialEmails,
            marketingEmails: data.marketingEmails,
            securityEmails: data.securityEmails,
            updatedAt: data.updatedAt,
          })
          .where(eq(userSettingsNotifications.userId, userId)),
      catch: (error) =>
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    }).then((result) => result.andThen(() => Result.ok()));
  }
}

/**
 * Singleton instance of the notifications repository.
 */
export const notificationsRepository = new NotificationsRepository();