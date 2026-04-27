/**
 * Real-time chat/messaging service.
 * Handles message persistence, read receipts, edit/delete trails, and reactions.
 * Uses in-memory storage for now - can be extended to use database.
 */

import { randomUUID } from "uncrypto";
import { connectionStore } from "../../lib/stores/dashboard/connection";
import { logger } from "~/lib/logger";

/**
 * Chat message interface.
 */
export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  createdAt: number;
  editedAt?: number;
  deletedAt?: number;
  reactions: Reaction[];
  readBy: string[];
}

/**
 * Message reaction interface.
 */
export interface Reaction {
  emoji: string;
  userId: string;
  createdAt: number;
}

/**
 * Read receipt interface (stored but not actively used in current implementation).
 */
export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: number;
}

/**
 * Message edit history entry.
 */
interface EditHistory {
  editedAt: number;
  previousContent: string;
}

/**
 * Chat service implementation.
 */
class ChatServiceImpl {
  private messages = new Map<string, ChatMessage>();
  private channels = new Map<string, Set<string>>();
  private editHistory = new Map<string, EditHistory[]>();

  /**
   * Maximum message length.
   */
  private readonly MAX_MESSAGE_LENGTH = 10000;

  /**
   * Maximum edit history entries.
   */
  private readonly MAX_EDIT_HISTORY = 10;

  /**
   * Creates a new chat message.
   *
   * @param channelId - Channel identifier
   * @param senderId - Sender user ID
   * @param content - Message content
   * @returns Created message
   */
  createMessage(channelId: string, senderId: string, content: string): ChatMessage {
    // Validate content length
    if (content.length > this.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message exceeds maximum length of ${this.MAX_MESSAGE_LENGTH}`);
    }

    const id = randomUUID();
    const now = Date.now();

    const message: ChatMessage = {
      id,
      channelId,
      senderId,
      content,
      createdAt: now,
      reactions: [],
      readBy: [senderId], // Sender has read their own message
    };

    this.messages.set(id, message);

    // Track channel membership
    if (!this.channels.has(channelId)) {
      this.channels.set(channelId, new Set());
    }
    this.channels.get(channelId)!.add(senderId);

    // Broadcast to channel
    this.broadcastToChannel(channelId, {
      type: "chat",
      chat: message,
    });

    logger.info(`Chat message created: ${id} in channel ${channelId}`);
    return message;
  }

  /**
   * Gets a message by ID.
   *
   * @param messageId - Message identifier
   * @returns Message if found
   */
  getMessage(messageId: string): ChatMessage | null {
    const message = this.messages.get(messageId);
    if (message?.deletedAt) return null;
    return message || null;
  }

  /**
   * Gets messages for a channel.
   *
   * @param channelId - Channel identifier
   * @param limit - Maximum messages to return
   * @param before - Message ID to get messages before (pagination)
   * @returns Array of messages
   */
  getChannelMessages(channelId: string, limit: number = 50, before?: string): ChatMessage[] {
    const channelMessages: ChatMessage[] = [];

    for (const message of this.messages.values()) {
      if (message.channelId === channelId && !message.deletedAt) {
        // oxlint-disable-next-line no-non-null-asserted-optional-chain
        if (before && message.createdAt >= this.messages.get(before)?.createdAt!) {
          continue;
        }
        channelMessages.push(message);
      }
    }

    // Sort by creation time descending
    channelMessages.sort((a, b) => b.createdAt - a.createdAt);

    return channelMessages.slice(0, limit);
  }

  /**
   * Updates a message (edit).
   *
   * @param messageId - Message identifier
   * @param userId - User making the edit
   * @param newContent - New message content
   * @returns Updated message
   */
  editMessage(messageId: string, userId: string, newContent: string): ChatMessage | null {
    const message = this.messages.get(messageId);
    if (!message) return null;

    // Only sender can edit
    if (message.senderId !== userId) {
      logger.warn(
        `User ${userId} attempted to edit message ${messageId} owned by ${message.senderId}`,
      );
      return null;
    }

    // Validate content length
    if (newContent.length > this.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message exceeds maximum length of ${this.MAX_MESSAGE_LENGTH}`);
    }

    // Store edit history
    const history = this.editHistory.get(messageId) || [];
    history.push({
      editedAt: message.editedAt || message.createdAt,
      previousContent: message.content,
    });

    // Trim history if too long
    if (history.length > this.MAX_EDIT_HISTORY) {
      history.shift();
    }
    this.editHistory.set(messageId, history);

    // Update message
    message.content = newContent;
    message.editedAt = Date.now();

    // Broadcast edit
    this.broadcastToChannel(message.channelId, {
      type: "chat",
      chat: message,
    });

    logger.info(`Chat message edited: ${messageId}`);
    return message;
  }

  /**
   * Deletes a message (soft delete).
   *
   * @param messageId - Message identifier
   * @param userId - User attempting delete
   * @returns True if successful
   */
  deleteMessage(messageId: string, userId: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    // Only sender or admin can delete (admin check not implemented)
    if (message.senderId !== userId) {
      return false;
    }

    message.deletedAt = Date.now();
    message.content = "[deleted]";

    // Broadcast deletion
    this.broadcastToChannel(message.channelId, {
      type: "chat",
      chat: message,
    });

    logger.info(`Chat message deleted: ${messageId}`);
    return true;
  }

  /**
   * Adds a reaction to a message.
   *
   * @param messageId - Message identifier
   * @param userId - User adding reaction
   * @param emoji - Emoji
   * @returns Updated message
   */
  addReaction(messageId: string, userId: string, emoji: string): ChatMessage | null {
    const message = this.messages.get(messageId);
    if (!message || message.deletedAt) return null;

    // Remove existing reaction from this user with same emoji
    message.reactions = message.reactions.filter(
      (r) => !(r.userId === userId && r.emoji === emoji),
    );

    // Add new reaction
    message.reactions.push({
      emoji,
      userId,
      createdAt: Date.now(),
    });

    // Broadcast reaction update
    this.broadcastToChannel(message.channelId, {
      type: "chat",
      chat: message,
    });

    return message;
  }

  /**
   * Removes a reaction from a message.
   *
   * @param messageId - Message identifier
   * @param userId - User removing reaction
   * @param emoji - Emoji
   * @returns Updated message
   */
  removeReaction(messageId: string, userId: string, emoji: string): ChatMessage | null {
    const message = this.messages.get(messageId);
    if (!message || message.deletedAt) return null;

    message.reactions = message.reactions.filter(
      (r) => !(r.userId === userId && r.emoji === emoji),
    );

    // Broadcast reaction update
    this.broadcastToChannel(message.channelId, {
      type: "chat",
      chat: message,
    });

    return message;
  }

  /**
   * Marks messages as read.
   *
   * @param channelId - Channel identifier
   * @param userId - User marking as read
   * @param messageIds - Messages being read
   */
  markAsRead(channelId: string, userId: string, messageIds: string[]): void {
    for (const messageId of messageIds) {
      const message = this.messages.get(messageId);
      if (!message || message.channelId !== channelId) continue;

      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
    }

    // Broadcast read receipt
    const data = JSON.stringify({
      type: "read_receipt",
      channelId,
      userId,
      messageIds,
    });

    this.broadcastToChannel(channelId, data);
  }

  /**
   * Gets edit history for a message.
   *
   * @param messageId - Message identifier
   * @returns Edit history entries
   */
  getEditHistory(messageId: string): EditHistory[] {
    return this.editHistory.get(messageId) || [];
  }

  /**
   * Broadcasts a message to a channel.
   *
   * @param channelId - Channel identifier
   * @param data - Data to broadcast
   */
  private broadcastToChannel(channelId: string, data: unknown): void {
    const dataStr = typeof data === "string" ? data : JSON.stringify(data);
    const channelMembers = this.channels.get(channelId) || new Set();

    for (const userId of channelMembers) {
      connectionStore.sendToUser(userId, dataStr);
    }
  }

  /**
   * Gets channel member count.
   *
   * @param channelId - Channel identifier
   * @returns Number of members
   */
  getMemberCount(channelId: string): number {
    return (this.channels.get(channelId) || new Set()).size;
  }

  /**
   * Cleans up old messages.
   * Should be called periodically.
   *
   * @param maxAge - Maximum age in milliseconds (default 30 days)
   * @returns Number of messages cleaned
   */
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;

    for (const [id, message] of this.messages) {
      if (message.createdAt < cutoff) {
        this.messages.delete(id);
        this.editHistory.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Singleton chat service.
 */
export const chatService = new ChatServiceImpl();