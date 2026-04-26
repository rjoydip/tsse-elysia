/**
 * Message validation schemas for WebSocket communication.
 * Uses Zod for runtime validation of all incoming messages.
 */

import { z } from "zod";

/**
 * Base message schema that all messages must conform to.
 * Every message must have a type and a unique ID.
 */
export const baseMessageSchema = z.object({
  /** Message type for routing */
  type: z.string(),
  /** Unique message identifier for acknowledgment */
  id: z.string().optional(),
});

/**
 * Message types supported by the WebSocket protocol.
 */
export type MessageType =
  | "ping"
  | "pong"
  | "subscribe"
  | "unsubscribe"
  | "notification"
  | "presence"
  | "typing"
  | "chat"
  | "dashboard"
  | "error";

/**
 * Ping message schema for heartbeat.
 */
export const pingMessageSchema = baseMessageSchema.extend({
  type: z.literal("ping"),
  timestamp: z.number().optional(),
});

/**
 * Pong response schema for heartbeat acknowledgment.
 */
export const pongMessageSchema = baseMessageSchema.extend({
  type: z.literal("pong"),
  timestamp: z.number().optional(),
});

/**
 * Subscription message for subscribing to channels.
 */
export const subscribeMessageSchema = baseMessageSchema.extend({
  type: z.literal("subscribe"),
  channel: z.string(),
  channelType: z.enum(["notification", "presence", "chat", "dashboard", "user"]),
});

/**
 * Unsubscribe message for leaving channels.
 */
export const unsubscribeMessageSchema = baseMessageSchema.extend({
  type: z.literal("unsubscribe"),
  channel: z.string(),
  channelType: z.enum(["notification", "presence", "chat", "dashboard", "user"]).optional(),
});

/**
 * Notification message schema.
 */
export const notificationMessageSchema = baseMessageSchema.extend({
  type: z.literal("notification"),
  notification: z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    body: z.string(),
    read: z.boolean().optional(),
    createdAt: z.number(),
  }),
});

/**
 * Presence update schema.
 */
export const presenceMessageSchema = baseMessageSchema.extend({
  type: z.literal("presence"),
  presence: z.object({
    userId: z.string(),
    status: z.enum(["online", "offline", "away"]),
    lastSeen: z.number().optional(),
  }),
});

/**
 * Typing indicator schema.
 */
export const typingMessageSchema = baseMessageSchema.extend({
  type: z.literal("typing"),
  typing: z.object({
    userId: z.string(),
    channel: z.string().optional(),
    isTyping: z.boolean(),
  }),
});

/**
 * Chat message schema.
 */
export const chatMessageSchema = baseMessageSchema.extend({
  type: z.literal("chat"),
  chat: z.object({
    id: z.string(),
    channelId: z.string(),
    senderId: z.string(),
    content: z.string().max(10000),
    createdAt: z.number(),
    editedAt: z.number().optional(),
    reactions: z
      .array(
        z.object({
          emoji: z.string(),
          userId: z.string(),
        }),
      )
      .optional(),
  }),
});

/**
 * Dashboard update schema.
 */
export const dashboardMessageSchema = baseMessageSchema.extend({
  type: z.literal("dashboard"),
  update: z.object({
    resource: z.string(),
    action: z.enum(["create", "update", "delete"]),
    data: z.unknown(),
  }),
});

/**
 * Error message schema.
 */
export const errorMessageSchema = baseMessageSchema.extend({
  type: z.literal("error"),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

/**
 * Union of all message schemas for parsing incoming messages.
 */
export const messageSchema = z.discriminatedUnion("type", [
  pingMessageSchema,
  pongMessageSchema,
  subscribeMessageSchema,
  unsubscribeMessageSchema,
  notificationMessageSchema,
  presenceMessageSchema,
  typingMessageSchema,
  chatMessageSchema,
  dashboardMessageSchema,
  errorMessageSchema,
]);

/**
 * Type inference from schemas.
 */
export type BaseMessage = z.infer<typeof baseMessageSchema>;
export type PingMessage = z.infer<typeof pingMessageSchema>;
export type PongMessage = z.infer<typeof pongMessageSchema>;
export type SubscribeMessage = z.infer<typeof subscribeMessageSchema>;
export type UnsubscribeMessage = z.infer<typeof unsubscribeMessageSchema>;
export type NotificationMessage = z.infer<typeof notificationMessageSchema>;
export type PresenceMessage = z.infer<typeof presenceMessageSchema>;
export type TypingMessage = z.infer<typeof typingMessageSchema>;
export type ChatMessageOutput = z.infer<typeof chatMessageSchema>;
export type DashboardMessage = z.infer<typeof dashboardMessageSchema>;
export type ErrorMessage = z.infer<typeof errorMessageSchema>;
export type ValidMessage = z.infer<typeof messageSchema>;

/**
 * Parses and validates an incoming message.
 * Returns null if validation fails.
 *
 * @param raw - Raw message data (string or object)
 * @returns Validated message or null
 */
export function parseMessage(raw: unknown): ValidMessage | null {
  try {
    // Parse JSON if string
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return messageSchema.safeParse(data).data || null;
  } catch {
    return null;
  }
}

/**
 * Creates a standardized error message.
 *
 * @param code - Error code
 * @param message - Error message
 * @param id - Optional message ID for correlation
 * @returns Error message object
 */
export function createErrorMessage(code: string, message: string, id?: string): ErrorMessage {
  return {
    type: "error",
    id,
    error: {
      code,
      message,
    },
  };
}

/**
 * Creates a pong response.
 *
 * @param id - Optional message ID for correlation
 * @returns Pong message object
 */
export function createPongMessage(id?: string): PongMessage {
  return {
    type: "pong",
    id,
    timestamp: Date.now(),
  };
}