/**
 * Notification settings service.
 * Encapsulates notification business logic, uses repository for DB operations.
 */

import type { NotificationsResponse, UpdateNotificationsInput } from "./types";
import {
  notificationsRepository,
  type INotificationsRepository,
} from "~/repositories/settings/notifications.repository";
import { Result } from "~/lib/result";
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
    const notificationsResult = await this.repository.findNotificationsByUserId(userId);

    if (Result.isOk(notificationsResult) && notificationsResult.value) {
      return {
        type: notificationsResult.value.type,
        mobile: notificationsResult.value.mobile,
        communication_emails: notificationsResult.value.communicationEmails,
        social_emails: notificationsResult.value.socialEmails,
        marketing_emails: notificationsResult.value.marketingEmails,
        security_emails: notificationsResult.value.securityEmails,
      };
    }

    // Notifications not found, return defaults
    return {
      type: "all",
      mobile: false,
      communication_emails: false,
      social_emails: true,
      marketing_emails: false,
      security_emails: true,
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
    const now = new Date();

    const existingResult = await this.repository.findNotificationsByUserId(userId);

    if (Result.isOk(existingResult) && existingResult.value) {
      // Notifications exist, update them
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
      // Notifications don't exist, create them
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