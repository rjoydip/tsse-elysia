/**
 * Notifications settings repository.
 * Handles all ORM (Drizzle) operations for user notification settings.
 */

import { eq } from "drizzle-orm";
import { db } from "~/config/db";
import { nanoid } from "nanoid";
import { userSettingsNotifications } from "~/lib/db/schema/user-settings";

/**
 * Repository interface for notifications settings database operations.
 */
export interface INotificationsRepository {
  findNotificationsByUserId(
    userId: string,
  ): Promise<typeof userSettingsNotifications.$inferSelect | undefined>;
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
  }): Promise<void>;
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
  ): Promise<void>;
}

/**
 * Notifications settings repository implementation using Drizzle ORM.
 */
export class NotificationsRepository implements INotificationsRepository {
  /**
   * Finds notification settings by user ID.
   */
  async findNotificationsByUserId(
    userId: string,
  ): Promise<typeof userSettingsNotifications.$inferSelect | undefined> {
    const [notifications] = await db
      .select()
      .from(userSettingsNotifications)
      .where(eq(userSettingsNotifications.userId, userId))
      .limit(1);
    return notifications;
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
  }): Promise<void> {
    await db.insert(userSettingsNotifications).values({
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
    });
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
  ): Promise<void> {
    await db
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
      .where(eq(userSettingsNotifications.userId, userId));
  }
}

/**
 * Singleton instance of the notifications repository.
 */
export const notificationsRepository = new NotificationsRepository();