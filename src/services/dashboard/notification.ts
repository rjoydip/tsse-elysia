/**
 * Real-time notification service.
 * Handles notification fan-out, unread counts, and notification categories.
 */

import { randomUUID } from "uncrypto";
import { connectionStore } from "../../lib/stores/dashboard/connection";
import { logger } from "~/lib/logger";

/**
 * Notification types supported by the system.
 */
export type NotificationType = "mention" | "reaction" | "system" | "info";

/**
 * Notification interface.
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * Notification storage entry with TTL.
 */
interface NotificationEntry {
  notification: Notification;
  expiresAt: number;
}

/**
 * In-memory notification store with TTL support.
 * For production, use Redis for persistence and scaling.
 */
class NotificationServiceImpl {
  private notifications = new Map<string, NotificationEntry>();
  private unreadCounts = new Map<string, number>();

  /**
   * Default TTL for notifications (7 days).
   */
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000;

  /**
   * Creates and stores a notification.
   *
   * @param notification - Notification data
   * @param ttlMs - Time to live in milliseconds
   * @returns Created notification
   */
  create(
    notification: Omit<Notification, "id" | "createdAt" | "read">,
    ttlMs: number = this.DEFAULT_TTL,
  ): Notification {
    const id = randomUUID();
    const now = Date.now();

    const fullNotification: Notification = {
      ...notification,
      id,
      read: false,
      createdAt: now,
    };

    // Store with TTL
    this.notifications.set(id, {
      notification: fullNotification,
      expiresAt: now + ttlMs,
    });

    // Update unread count
    this.incrementUnreadCount(notification.userId);

    // Send real-time notification if user is connected
    this.sendToUser(fullNotification);

    logger.info(`Notification created: ${id} for user ${notification.userId}`);
    return fullNotification;
  }

  /**
   * Sends notification to user via WebSocket.
   *
   * @param notification - Notification to send
   */
  private sendToUser(notification: Notification): void {
    const data = JSON.stringify({
      type: "notification",
      id: notification.id,
      notification,
    });

    connectionStore.sendToUser(notification.userId, data);
  }

  /**
   * Sends notification to connected users.
   *
   * @param _userId - User identifier (unused, notification contains userId)
   * @param notification - Notification to send
   */
  send(_userId: string, notification: Notification): void {
    this.sendToUser(notification);
  }

  /**
   * Gets a notification by ID.
   *
   * @param id - Notification identifier
   * @returns Notification if found and not expired
   */
  get(id: string): Notification | null {
    const entry = this.notifications.get(id);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.notifications.delete(id);
      return null;
    }

    return entry.notification;
  }

  /**
   * Gets all notifications for a user.
   *
   * @param userId - User identifier
   * @param limit - Maximum number to return
   * @param offset - Offset for pagination
   * @returns Array of notifications
   */
  getByUser(userId: string, limit: number = 50, offset: number = 0): Notification[] {
    const now = Date.now();
    const userNotifications: Notification[] = [];

    for (const entry of this.notifications.values()) {
      if (entry.notification.userId === userId && now < entry.expiresAt) {
        userNotifications.push(entry.notification);
      }
    }

    // Sort by creation time descending
    userNotifications.sort((a, b) => b.createdAt - a.createdAt);

    return userNotifications.slice(offset, offset + limit);
  }

  /**
   * Marks a notification as read.
   *
   * @param id - Notification identifier
   * @param userId - User who owns the notification
   * @returns True if successful
   */
  markAsRead(id: string, userId: string): boolean {
    const entry = this.notifications.get(id);
    if (!entry) return false;

    if (entry.notification.userId !== userId) return false;

    const wasUnread = !entry.notification.read;
    entry.notification.read = true;

    if (wasUnread) {
      this.decrementUnreadCount(userId);
    }

    return true;
  }

  /**
   * Marks all notifications as read for a user.
   *
   * @param userId - User identifier
   * @returns Number of notifications marked
   */
  markAllAsRead(userId: string): number {
    let count = 0;

    for (const entry of this.notifications.values()) {
      if (entry.notification.userId === userId && !entry.notification.read) {
        entry.notification.read = true;
        count++;
      }
    }

    if (count > 0) {
      this.unreadCounts.set(userId, 0);
    }

    return count;
  }

  /**
   * Gets unread notification count for a user.
   *
   * @param userId - User identifier
   * @returns Unread count
   */
  getUnreadCount(userId: string): number {
    return this.unreadCounts.get(userId) || 0;
  }

  /**
   * Increments unread count for a user.
   *
   * @param userId - User identifier
   */
  private incrementUnreadCount(userId: string): void {
    const current = this.unreadCounts.get(userId) || 0;
    this.unreadCounts.set(userId, current + 1);

    // Broadcast unread count update
    this.broadcastUnreadCount(userId);
  }

  /**
   * Decrements unread count for a user.
   *
   * @param userId - User identifier
   */
  private decrementUnreadCount(userId: string): void {
    const current = this.unreadCounts.get(userId) || 0;
    this.unreadCounts.set(userId, Math.max(0, current - 1));

    // Broadcast unread count update
    this.broadcastUnreadCount(userId);
  }

  /**
   * Broadcasts unread count to user.
   *
   * @param userId - User identifier
   */
  private broadcastUnreadCount(userId: string): void {
    const data = JSON.stringify({
      type: "unread_count",
      count: this.getUnreadCount(userId),
    });

    connectionStore.sendToUser(userId, data);
  }

  /**
   * Deletes a notification.
   *
   * @param id - Notification identifier
   * @param userId - User who owns the notification
   * @returns True if successful
   */
  delete(id: string, userId: string): boolean {
    const entry = this.notifications.get(id);
    if (!entry) return false;

    if (entry.notification.userId !== userId) return false;

    const wasUnread = !entry.notification.read;
    this.notifications.delete(id);

    if (wasUnread) {
      this.decrementUnreadCount(userId);
    }

    return true;
  }

  /**
   * Cleans up expired notifications.
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, entry] of this.notifications) {
      if (now > entry.expiresAt) {
        this.notifications.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Creates a mention notification.
   *
   * @param mentionedUserId - User being mentioned
   * @param mentionedBy - User who mentioned
   * @param context - Context (e.g., comment ID, message ID)
   * @param title - Notification title
   * @param body - Notification body
   */
  createMention(
    mentionedUserId: string,
    mentionedBy: string,
    context: string,
    title: string,
    body: string,
  ): Notification {
    return this.create({
      userId: mentionedUserId,
      type: "mention",
      title,
      body,
      metadata: { mentionedBy, context },
    });
  }

  /**
   * Creates a reaction notification.
   *
   * @param userId - User who reacted
   * @param targetUserId - User who owns the content
   * @param context - Context (e.g., message ID)
   * @param emoji - Emoji used
   */
  createReaction(
    userId: string,
    targetUserId: string,
    context: string,
    emoji: string,
  ): Notification {
    return this.create({
      userId: targetUserId,
      type: "reaction",
      title: "New Reaction",
      body: `reacted with ${emoji}`,
      metadata: { userId, context, emoji },
    });
  }

  /**
   * Creates a system notification.
   *
   * @param userId - User to notify
   * @param title - Notification title
   * @param body - Notification body
   */
  createSystem(userId: string, title: string, body: string): Notification {
    return this.create({
      userId,
      type: "system",
      title,
      body,
    });
  }
}

/**
 * Singleton notification service.
 */
export const notificationService = new NotificationServiceImpl();