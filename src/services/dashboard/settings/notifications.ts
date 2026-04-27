/**
 * Notification settings service.
 * Encapsulates notification preferences CRUD operations.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "~/config/db";
import { nanoid } from "nanoid";
import { settingsLogger } from "~/lib/logger";

export interface NotificationsResponse {
  type: "all" | "mentions" | "none";
  mobile: boolean;
  communication_emails: boolean;
  social_emails: boolean;
  marketing_emails: boolean;
  security_emails: boolean;
}

export interface UpdateNotificationsInput {
  type: "all" | "mentions" | "none";
  mobile: boolean;
  communication_emails: boolean;
  social_emails: boolean;
  marketing_emails: boolean;
  security_emails: boolean;
}

export async function getNotifications(userId: string): Promise<NotificationsResponse> {
  const [notifications] = await db
    .select()
    .from(schema.userSettingsNotifications)
    .where(eq(schema.userSettingsNotifications.userId, userId))
    .limit(1);

  if (!notifications) {
    return {
      type: "all",
      mobile: false,
      communication_emails: false,
      social_emails: true,
      marketing_emails: false,
      security_emails: true,
    };
  }

  return {
    type: notifications.type,
    mobile: notifications.mobile,
    communication_emails: notifications.communicationEmails,
    social_emails: notifications.socialEmails,
    marketing_emails: notifications.marketingEmails,
    security_emails: notifications.securityEmails,
  };
}

export async function updateNotifications(
  userId: string,
  input: UpdateNotificationsInput,
): Promise<NotificationsResponse> {
  const { type, mobile, communication_emails, social_emails, marketing_emails, security_emails } =
    input;

  const existing = await db
    .select()
    .from(schema.userSettingsNotifications)
    .where(eq(schema.userSettingsNotifications.userId, userId))
    .limit(1);

  const now = new Date();

  if (existing.length > 0) {
    await db
      .update(schema.userSettingsNotifications)
      .set({
        type,
        mobile,
        communicationEmails: communication_emails,
        socialEmails: social_emails,
        marketingEmails: marketing_emails,
        securityEmails: security_emails,
        updatedAt: now,
      })
      .where(eq(schema.userSettingsNotifications.userId, userId));

    settingsLogger.debug("Notifications updated", { userId });
  } else {
    await db.insert(schema.userSettingsNotifications).values({
      id: nanoid(),
      userId,
      type,
      mobile,
      communicationEmails: communication_emails,
      socialEmails: social_emails,
      marketingEmails: marketing_emails,
      securityEmails: security_emails,
      createdAt: now,
      updatedAt: now,
    });

    settingsLogger.debug("Notifications created", { userId });
  }

  return {
    type,
    mobile,
    communication_emails,
    social_emails,
    marketing_emails,
    security_emails,
  };
}