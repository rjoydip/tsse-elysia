/**
 * Notification settings service.
 * Encapsulates notification business logic, uses repository for DB operations.
 */

import type { NotificationsResponse, UpdateNotificationsInput } from "./types";
import {
  notificationsRepository,
  type INotificationsRepository,
} from "~/repositories/settings/notifications.repository";
import { settingsLogger } from "~/lib/logger";

/**
 * Notifications service interface.
 */
export interface INotificationsService {
  getNotifications(userId: string): Promise<NotificationsResponse>;
  updateNotifications(
    userId: string,
    input: UpdateNotificationsInput,
  ): Promise<NotificationsResponse>;
}

/**
 * Notifications service implementation.
 */
export class NotificationsService implements INotificationsService {
  private repository: INotificationsRepository;

  constructor(repository: INotificationsRepository = notificationsRepository) {
    this.repository = repository;
  }

  /**
   * Gets a user's notification settings, returning defaults if not found.
   */
  async getNotifications(userId: string): Promise<NotificationsResponse> {
    const notifications = await this.repository.findNotificationsByUserId(userId);

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

  /**
   * Updates a user's notification settings.
   */
  async updateNotifications(
    userId: string,
    input: UpdateNotificationsInput,
  ): Promise<NotificationsResponse> {
    const { type, mobile, communication_emails, social_emails, marketing_emails, security_emails } =
      input;
    const existing = await this.repository.findNotificationsByUserId(userId);
    const now = new Date();

    if (existing) {
      await this.repository.updateNotifications(userId, {
        type,
        mobile,
        communicationEmails: communication_emails,
        socialEmails: social_emails,
        marketingEmails: marketing_emails,
        securityEmails: security_emails,
        updatedAt: now,
      });
      settingsLogger.debug("Notifications updated", { userId });
    } else {
      await this.repository.createNotifications({
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
}

/**
 * Singleton instance of the notifications service.
 */
export const notificationsService = new NotificationsService();

// Re-export types
export type { NotificationsResponse, UpdateNotificationsInput };