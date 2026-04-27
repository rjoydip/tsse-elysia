/**
 * Real-time module entry point.
 * Exports all real-time services and utilities for easy access.
 */

// Connection management
export {
  connectionStore,
  type ConnectionMetadata,
  type WebSocketConnection,
} from "../stores/dashboard/connection";

// Authentication
export {
  authenticateConnection,
  validateOrigin,
  withAuth,
  type AuthResult,
} from "../auth/dashboard";

// Message schemas
export {
  messageSchema,
  baseMessageSchema,
  parseMessage,
  createErrorMessage,
  createPongMessage,
  type ValidMessage,
  type MessageType,
  type PingMessage,
  type PongMessage,
  type SubscribeMessage,
  type UnsubscribeMessage,
  type NotificationMessage,
  type PresenceMessage,
  type TypingMessage,
  type DashboardMessage,
  type ErrorMessage,
} from "../db/dashboard/schema";

// Content sanitization
export { sanitizeContent, stripHtml, validateContent, sanitizeMessage } from "./sanitizer";

// Authorization
export {
  authorize,
  hasPermission,
  getPermissions,
  getUserRole,
  createGuard,
  checkAuthorization,
  meetsRoleRequirement,
  type UserRole,
  type Permission,
} from "../auth/dashboard/authorization";

// Rate limiting
export {
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  rateLimiter,
  defaultRateLimitConfig,
  type RateLimitConfig,
} from "./rate-limit";

// CSRF
export {
  validateCsrfToken,
  generateCsrfToken,
  csrfTokenStore,
  defaultCsrfConfig,
  type CsrfConfig,
} from "./csrf";

// Services
export {
  notificationService,
  type Notification,
  type NotificationType,
} from "../../services/dashboard/notification";
export {
  presenceService,
  type Presence,
  type PresenceStatus,
} from "../../services/dashboard/presence";
export {
  dashboardService,
  type DashboardUpdate,
  type DashboardResource,
  type DashboardAction,
} from "../../services/dashboard/dashboard";
export { chatService, type Reaction } from "../../services/dashboard/chat";

// Re-export types
export type { Context } from "elysia";