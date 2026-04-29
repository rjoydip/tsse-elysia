/**
 * Dashboard library barrel file.
 * Re-exports all dashboard-related modules for convenient importing.
 */

// Connection store (WebSocket connections)
export { connectionStore } from "~/lib/stores/dashboard/connection";

// Authentication for WebSocket connections
export { authenticateConnection, validateOrigin } from "~/lib/auth/dashboard";

// Message parsing and creation for WebSocket
export { parseMessage, createPongMessage } from "~/services/dashboard/schema";

// Rate limiting for dashboard/WebSocket
export { checkRateLimit } from "./rate-limit";

// Dashboard services
export { notificationService } from "~/services/dashboard/notification";
export { presenceService } from "~/services/dashboard/presence";
export { dashboardService } from "~/services/dashboard/main";