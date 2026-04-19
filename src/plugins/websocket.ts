/**
 * WebSocket plugin configuration for ElysiaJS.
 * Sets up WebSocket handling with authentication, heartbeat, and message routing.
 */

import { Elysia } from "elysia";
import {
  connectionStore,
  authenticateConnection,
  validateOrigin,
  parseMessage,
  createPongMessage,
  checkRateLimit,
  notificationService,
  presenceService,
  dashboardService,
} from "~/lib/realtime";
import { apiLogger } from "~/lib/logger";

/**
 * Heartbeat configuration.
 */
export const HEARTBEAT_CONFIG = {
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds for pong response
  maxMissed: 5, // Disconnect after 5 missed heartbeats
};

/**
 * WebSocket configuration options.
 */
export interface WebSocketConfig {
  /** Enable authentication (default: true) */
  requireAuth: boolean;
  /** Heartbeat interval in milliseconds */
  heartbeatInterval: number;
  /** Maximum missed heartbeats before disconnect */
  maxMissedHeartbeats: number;
  /** Maximum message size in bytes */
  maxMessageSize: number;
  /** Allowed origins (empty = all) */
  allowedOrigins: string[];
}

/**
 * Default WebSocket configuration.
 */
export const defaultWebSocketConfig: WebSocketConfig = {
  requireAuth: true,
  heartbeatInterval: HEARTBEAT_CONFIG.interval,
  maxMissedHeartbeats: HEARTBEAT_CONFIG.maxMissed,
  maxMessageSize: 10240, // 10KB
  allowedOrigins: [],
};

/**
 * Creates the WebSocket plugin with all features.
 *
 * @param config - Optional configuration
 * @returns Elysia plugin
 */
export function createWebSocketPlugin(config: Partial<WebSocketConfig> = {}) {
  const finalConfig = { ...defaultWebSocketConfig, ...config };

  return new Elysia({
    name: "realtime.websocket",
  })
    .ws("/ws", {
      async open(ws: any) {
        // Validate origin
        if (!validateOrigin({ headers: ws.data.headers } as any)) {
          (ws.raw as any).close(1008, "Invalid origin");
          return;
        }

        // Authenticate connection
        let authResult = null;
        if (finalConfig.requireAuth) {
          authResult = await authenticateConnection({ query: ws.data.query } as any);
          if (!authResult) {
            (ws.raw as any).close(1008, "Authentication required");
            return;
          }
        }

        // Register connection
        const connectionId = connectionStore.register(ws.raw as any, authResult?.userId || null, {
          email: authResult?.email || null,
          userAgent: ws.data.headers?.["user-agent"] || "",
        });

        // Store connection ID on websocket
        (ws as any).connectionId = connectionId;
        (ws as any).userId = authResult?.userId || null;

        // Set presence to online if authenticated
        if (authResult?.userId) {
          presenceService.userOnline(authResult.userId);
        }

        // Start heartbeat
        startHeartbeat(ws, finalConfig.heartbeatInterval, finalConfig.maxMissedHeartbeats);

        apiLogger.info(`WebSocket connection opened: ${connectionId}`);
      },

      async message(ws, message) {
        const connectionId = (ws as any).connectionId;
        if (!connectionId) return;

        // Check rate limit
        if (!checkRateLimit(connectionId)) {
          ws.send(
            JSON.stringify({
              type: "error",
              error: { code: "RATE_LIMITED", message: "Too many messages" },
            }),
          );
          return;
        }

        // Parse and validate message
        const parsed = parseMessage(message);
        if (!parsed) {
          ws.send(
            JSON.stringify({
              type: "error",
              error: { code: "INVALID_MESSAGE", message: "Invalid message format" },
            }),
          );
          return;
        }

        // Route message based on type
        await handleMessage(ws, parsed);
      },

      async close(ws) {
        const connectionId = (ws as any).connectionId;
        const userId = (ws as any).userId;

        // Stop heartbeat
        stopHeartbeat(ws);

        // Set presence to offline
        if (userId) {
          presenceService.userOffline(userId);
        }

        // Clean up
        if (connectionId) {
          connectionStore.unregister(connectionId);
          dashboardService.cleanupConnection(connectionId);
        }

        apiLogger.info(`WebSocket connection closed: ${connectionId}`);
      },

      async ping(ws) {
        // Respond with pong
        ws.send(JSON.stringify(createPongMessage()));
      },
    })
    .ws("/ws/health", {
      open(ws: any) {
        ws.send(JSON.stringify({ type: "health", status: "ok", timestamp: Date.now() }));
      },
    });
}

/**
 * Handles incoming messages based on type.
 */
async function handleMessage(ws: any, message: any): Promise<void> {
  const userId = ws.userId;

  switch (message.type) {
    case "ping":
      ws.send(JSON.stringify(createPongMessage(message.id)));
      break;

    case "subscribe":
      if (message.channelType === "dashboard") {
        dashboardService.subscribe(ws.connectionId, [message.channel]);
      }
      break;

    case "unsubscribe":
      if (message.channelType === "dashboard") {
        dashboardService.unsubscribe(ws.connectionId, [message.channel]);
      }
      break;

    case "typing":
      if (userId && message.typing?.channel) {
        if (message.typing.isTyping) {
          presenceService.startTyping(userId, message.typing.channel);
        } else {
          presenceService.stopTyping(userId, message.typing.channel);
        }
      }
      break;

    case "chat":
      // Chat handling would be done here
      // For now, just acknowledge
      break;

    default:
      apiLogger.warn(`Unknown message type: ${message.type}`);
  }
}

/**
 * Heartbeat timer storage.
 */
const heartbeatTimers = new Map<any, NodeJS.Timeout>();

/**
 * Starts heartbeat for a WebSocket connection.
 */
function startHeartbeat(ws: any, interval: number, maxMissed: number): void {
  const timer = setInterval(() => {
    const conn = connectionStore.get(ws.connectionId);
    if (!conn) {
      clearInterval(timer);
      return;
    }

    // Check missed heartbeats
    conn.metadata.missedHeartbeats++;
    connectionStore.update(ws.connectionId, {
      lastHeartbeat: Date.now(),
    });

    if (conn.metadata.missedHeartbeats >= maxMissed) {
      ws.close(1008, "Connection timeout");
      clearInterval(timer);
      return;
    }

    // Send ping
    ws.ping();
  }, interval);

  heartbeatTimers.set(ws, timer);
}

/**
 * Stops heartbeat for a WebSocket connection.
 */
function stopHeartbeat(ws: any): void {
  const timer = heartbeatTimers.get(ws);
  if (timer) {
    clearInterval(timer);
    heartbeatTimers.delete(ws);
  }
}

/**
 * Heartbeat cleanup interval.
 */
setInterval(() => {
  connectionStore.cleanup();
  presenceService.cleanup();
  notificationService.cleanup();
  dashboardService.flush();
}, 60000);

/**
 * WebSocket plugin instance.
 */
export const websocketPlugin = createWebSocketPlugin();