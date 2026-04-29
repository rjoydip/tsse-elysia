/**
 * Live user presence service.
 * Tracks online/offline/away status and typing indicators.
 */

import { connectionStore } from "../../lib/stores/dashboard/connection";
import { logger } from "~/lib/logger";

/**
 * User presence status.
 */
export type PresenceStatus = "online" | "offline" | "away";

/**
 * User presence information.
 */
export interface Presence {
  userId: string;
  status: PresenceStatus;
  lastSeen: number;
  metadata?: Record<string, unknown>;
}

/**
 * Typing indicator entry.
 */
interface TypingEntry {
  userId: string;
  channel: string;
  startedAt: number;
}

/**
 * Presence service implementation.
 */
class PresenceServiceImpl {
  private presences = new Map<string, Presence>();
  private typingIndicators = new Map<string, Map<string, TypingEntry>>();
  private updateCallbacks: ((presence: Presence) => void)[] = [];

  /**
   * Typing indicator timeout in milliseconds.
   */
  private readonly TYPING_TIMEOUT = 5000;

  /**
   * Sets user presence status.
   *
   * @param userId - User identifier
   * @param status - Presence status
   * @param metadata - Optional metadata
   */
  setPresence(userId: string, status: PresenceStatus, metadata?: Record<string, unknown>): void {
    const presence: Presence = {
      userId,
      status,
      lastSeen: Date.now(),
      metadata,
    };

    this.presences.set(userId, presence);

    // Broadcast presence update
    this.broadcastPresence(presence);

    logger.info(`Presence updated: ${userId} -> ${status}`);
  }

  /**
   * Gets user presence.
   *
   * @param userId - User identifier
   * @returns Presence if found
   */
  getPresence(userId: string): Presence | null {
    return this.presences.get(userId) || null;
  }

  /**
   * Gets all online users.
   *
   * @returns Array of presences
   */
  getOnlineUsers(): Presence[] {
    return Array.from(this.presences.values()).filter((p) => p.status === "online");
  }

  /**
   * Gets presences for a list of users.
   *
   * @param userIds - Array of user identifiers
   * @returns Map of userId to presence
   */
  getMultiplePresences(userIds: string[]): Map<string, Presence | null> {
    const result = new Map<string, Presence | null>();
    for (const userId of userIds) {
      result.set(userId, this.getPresence(userId));
    }
    return result;
  }

  /**
   * Broadcasts presence update to relevant channels.
   *
   * @param presence - Presence to broadcast
   */
  private broadcastPresence(presence: Presence): void {
    const data = JSON.stringify({
      type: "presence",
      presence,
    });

    // Broadcast to all connected users
    connectionStore.broadcast(data);

    // Notify callbacks
    for (const callback of this.updateCallbacks) {
      callback(presence);
    }
  }

  /**
   * Sets user as online (connection established).
   *
   * @param userId - User identifier
   * @param metadata - Optional metadata
   */
  userOnline(userId: string, metadata?: Record<string, unknown>): void {
    this.setPresence(userId, "online", metadata);
  }

  /**
   * Sets user as away (no activity for timeout period).
   *
   * @param userId - User identifier
   */
  userAway(userId: string): void {
    this.setPresence(userId, "away");
  }

  /**
   * Sets user as offline (connection closed).
   *
   * @param userId - User identifier
   */
  userOffline(userId: string): void {
    this.setPresence(userId, "offline");
  }

  /**
   * Updates last seen timestamp.
   *
   * @param userId - User identifier
   */
  updateLastSeen(userId: string): void {
    const presence = this.presences.get(userId);
    if (presence && presence.status !== "offline") {
      presence.lastSeen = Date.now();
    }
  }

  /**
   * Starts typing indicator.
   *
   * @param userId - User identifier
   * @param channel - Channel where typing
   */
  startTyping(userId: string, channel: string): void {
    // Initialize channel map if needed
    if (!this.typingIndicators.has(channel)) {
      this.typingIndicators.set(channel, new Map());
    }

    const channelTyping = this.typingIndicators.get(channel)!;
    channelTyping.set(userId, {
      userId,
      channel,
      startedAt: Date.now(),
    });

    // Broadcast typing start
    this.broadcastTyping(userId, channel, true);
  }

  /**
   * Stops typing indicator.
   *
   * @param userId - User identifier
   * @param channel - Channel where typing stopped
   */
  stopTyping(userId: string, channel: string): void {
    const channelTyping = this.typingIndicators.get(channel);
    if (channelTyping) {
      channelTyping.delete(userId);
    }

    // Broadcast typing stop
    this.broadcastTyping(userId, channel, false);
  }

  /**
   * Checks if user is typing in a channel.
   *
   * @param userId - User identifier
   * @param channel - Channel to check
   * @returns True if typing
   */
  isTyping(userId: string, channel: string): boolean {
    const channelTyping = this.typingIndicators.get(channel);
    if (!channelTyping) return false;

    const entry = channelTyping.get(userId);
    if (!entry) return false;

    // Check if timeout expired
    if (Date.now() - entry.startedAt > this.TYPING_TIMEOUT) {
      channelTyping.delete(userId);
      return false;
    }

    return true;
  }

  /**
   * Gets users typing in a channel.
   *
   * @param channel - Channel identifier
   * @returns Array of user IDs currently typing
   */
  getTypingUsers(channel: string): string[] {
    const channelTyping = this.typingIndicators.get(channel);
    if (!channelTyping) return [];

    const now = Date.now();
    const active: string[] = [];

    for (const [userId, entry] of channelTyping) {
      if (now - entry.startedAt <= this.TYPING_TIMEOUT) {
        active.push(userId);
      } else {
        channelTyping.delete(userId);
      }
    }

    return active;
  }

  /**
   * Broadcasts typing indicator.
   *
   * @param userId - User identifier
   * @param channel - Channel identifier
   * @param isTyping - Whether typing started or stopped
   */
  private broadcastTyping(userId: string, channel: string, isTyping: boolean): void {
    const data = JSON.stringify({
      type: "typing",
      typing: {
        userId,
        channel,
        isTyping,
      },
    });

    // Broadcast to channel subscribers
    connectionStore.broadcast(data);
  }

  /**
   * Registers a callback for presence updates.
   *
   * @param callback - Function to call on presence changes
   */
  onPresenceUpdate(callback: (presence: Presence) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Cleans up stale presence data.
   * Should be called periodically.
   */
  cleanup(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [_userId, presence] of this.presences) {
      if (now - presence.lastSeen > timeout && presence.status !== "offline") {
        // Auto-mark as away if no recent updates
        presence.status = "away";
        this.broadcastPresence(presence);
      }
    }

    // Clean up typing indicators
    for (const [_channel, typing] of this.typingIndicators) {
      for (const [userId, entry] of typing) {
        if (now - entry.startedAt > this.TYPING_TIMEOUT) {
          typing.delete(userId);
        }
      }
    }
  }
}

/**
 * Singleton presence service.
 */
export const presenceService = new PresenceServiceImpl();