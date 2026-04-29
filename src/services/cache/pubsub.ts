/**
 * Pub/Sub module using Unstorage's built-in event system.
 * Provides typed channel definitions and convenience wrappers
 * for publishing and subscribing to events.
 *
 * Event System:
 * - In-process: Uses unstorage's built-in event emitter (works with all backends)
 * - Cross-instance: Uses unstorage's `watch`/`unwatch` for Redis keyspace notifications
 *
 * For true distributed pub/sub across multiple instances, Redis is required.
 * Other backends (PostgreSQL, LRU) only support in-process events.
 *
 * @module services/cache/pubsub
 * @see https://unstorage.unjs.io
 */

import type { Storage } from "unstorage";
import { getStorage, getStorageBackend, isPubSubSupported } from "./index";
import { cacheLogger } from "~/lib/logger";

/**
 * Predefined channel names for the application.
 * All channels are namespaced with "tsse:pubsub:" to avoid collisions.
 * Add new channels here as features require them.
 */
export const PUBSUB_CHANNELS = {
  /** User-related events (login, logout, profile update) */
  USER_EVENTS: "tsse:pubsub:user:events",
  /** System notifications (deployments, maintenance windows) */
  SYSTEM_NOTIFICATIONS: "tsse:pubsub:system:notifications",
  /** MCP server events (tool invocations, client connections) */
  MCP_EVENTS: "tsse:pubsub:mcp:events",
  /** Real-time dashboard metric updates */
  DASHBOARD_UPDATES: "tsse:pubsub:dashboard:updates",
  /** Cache invalidation signals across instances */
  CACHE_INVALIDATION: "tsse:pubsub:cache:invalidation",
} as const;

/** Type for valid channel names — provides autocomplete and type-safety */
export type PubSubChannel = (typeof PUBSUB_CHANNELS)[keyof typeof PUBSUB_CHANNELS];

/**
 * Message payload structure for typed pub/sub events.
 * All published messages follow this shape for consistency.
 *
 * @template T - The type of the event-specific data payload
 */
export interface PubSubMessage<T = unknown> {
  /** Event type identifier (e.g., "user.login", "cache.clear") */
  type: string;
  /** Event payload data */
  data: T;
  /** ISO timestamp of when the event was created */
  timestamp: string;
  /** Optional source identifier (service/module name) */
  source?: string;
}

/**
 * Pub/Sub connection status for health checks.
 */
export interface PubSubStatus {
  /** Whether Pub/Sub is supported by the current backend */
  supported: boolean;
  /** Whether cross-instance pub/sub is available */
  crossInstance: boolean;
  /** Current storage backend type */
  backend: "redis" | "postgres" | "lru";
  /** Number of active subscriptions */
  subscriptionCount: number;
}

/** Track active subscriptions */
const activeSubscriptions = new Map<
  PubSubChannel,
  Set<(message: PubSubMessage, channel: string) => void>
>();

/**
 * Gets the storage instance, ensuring it's initialized.
 */
function getStorageInstance(): Storage | null {
  return getStorage();
}

/**
 * Checks if Pub/Sub can be used based on backend type and storage availability.
 */
function canUsePubSub(): boolean {
  const storage = getStorageInstance();
  if (!storage) {
    cacheLogger.debug("Storage not available, Pub/Sub disabled");
    return false;
  }
  return true;
}

/**
 * Publishes a typed message to a channel.
 * Serializes the message as JSON and stores it in unstorage.
 * The `watch` API will detect this and notify subscribers.
 *
 * For cross-instance pub/sub with Redis, this requires:
 * - Redis with keyspace notifications enabled (CONFIG SET notify-keyspace-events Ex)
 *
 * @param channel - Target channel name (use PUBSUB_CHANNELS constants)
 * @param message - Typed message payload to broadcast
 * @returns Number of subscribers that received the message, or 0 on failure
 */
export async function publish<T>(
  channel: PubSubChannel,
  message: PubSubMessage<T>,
): Promise<number> {
  if (!canUsePubSub()) {
    cacheLogger.debug("Pub/Sub not available, skipping publish", {
      channel,
      backend: getStorageBackend(),
    });
    return 0;
  }

  const storage = getStorageInstance()!;

  try {
    const serialized = JSON.stringify(message);
    const eventKey = `${channel}:event`;
    const eventId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;

    // Store the event in unstorage with a unique ID
    await storage.setItem(eventKey, {
      id: eventId,
      message: serialized,
      timestamp: message.timestamp,
    });

    // Emit locally using unstorage's event system (if available)
    const storageWithEvents = storage as Storage & {
      emit?: (event: string, data: unknown) => void | Promise<void>;
    };
    if (storageWithEvents.emit) {
      await storageWithEvents.emit(channel, { message, channel });
    }

    // Notify in-process subscribers
    const subscribers = activeSubscriptions.get(channel);
    if (subscribers) {
      for (const handler of subscribers) {
        try {
          handler(message, channel);
        } catch {
          // Ignore handler errors
        }
      }
    }

    cacheLogger.debug("Published Pub/Sub message", {
      channel,
      type: message.type,
      backend: getStorageBackend(),
    });

    return subscribers?.size ?? 0;
  } catch (error) {
    cacheLogger.error("Failed to publish Pub/Sub message", error as Error);
    return 0;
  }
}

/**
 * Subscribes to a channel with a typed message handler.
 * The handler is called when a message is published to the channel.
 *
 * For in-process pub/sub: Uses unstorage's event emitter
 * For Redis: Uses `watch`/`unwatch` for keyspace notifications
 *
 * @param channel - Channel to subscribe to (use PUBSUB_CHANNELS constants)
 * @param handler - Callback invoked for each received message
 */
export async function subscribe<T>(
  channel: PubSubChannel,
  handler: (message: PubSubMessage<T>, channel: string) => void,
): Promise<void> {
  if (!canUsePubSub()) {
    cacheLogger.debug("Pub/Sub not available, skipping subscribe", {
      channel,
      backend: getStorageBackend(),
    });
    return;
  }

  const storage = getStorageInstance()!;
  const backend = getStorageBackend();

  // Track subscription locally
  if (!activeSubscriptions.has(channel)) {
    activeSubscriptions.set(channel, new Set());
  }
  activeSubscriptions
    .get(channel)!
    .add(handler as (message: PubSubMessage, channel: string) => void);

  try {
    // For in-process events, use unstorage's on() method
    if (typeof (storage as Storage & { on?: unknown }).on === "function") {
      const typedStorage = storage as Storage & {
        on(
          event: string,
          handler: (data: { message: PubSubMessage; channel: string }) => void,
        ): void;
      };
      typedStorage.on(channel, ({ message: msg, channel: ch }) => {
        handler(msg as PubSubMessage<T>, ch ?? channel);
      });
    }

    // For Redis with keyspace notifications, set up watch
    if (backend === "redis" && isPubSubSupported()) {
      const eventKey = `${channel}:event`;
      if (typeof (storage as Storage & { watch?: unknown }).watch === "function") {
        const typedStorage = storage as Storage & {
          watch(
            key: string,
            handler: (event: "update" | "remove", key: string) => void,
          ): () => void;
        };

        // Watch for changes to the event key
        typedStorage.watch(eventKey, (event) => {
          if (event === "update") {
            // Fetch and parse the latest event
            storage.getItem<string>(eventKey).then((data) => {
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  const message = JSON.parse(parsed.message) as PubSubMessage<T>;
                  handler(message, channel);
                } catch {
                  // Ignore parse errors
                }
              }
            });
          }
        });

        cacheLogger.debug("Set up Redis keyspace watch for Pub/Sub channel", {
          channel,
        });
      }
    }

    cacheLogger.info("Subscribed to Pub/Sub channel", {
      channel,
      backend,
      crossInstance: backend === "redis",
    });
  } catch (error) {
    cacheLogger.error("Failed to subscribe to Pub/Sub channel", error as Error);
  }
}

/**
 * Unsubscribes from a channel.
 * Removes the handler from the subscription list.
 *
 * @param channel - Channel to unsubscribe from
 * @param handler - The handler to remove (optional, removes all if not provided)
 */
export function unsubscribe<T>(
  channel: PubSubChannel,
  handler?: (message: PubSubMessage<T>, channel: string) => void,
): void {
  const subscribers = activeSubscriptions.get(channel);
  if (!subscribers) {
    return;
  }

  if (handler) {
    subscribers.delete(handler as (message: PubSubMessage, channel: string) => void);
    if (subscribers.size === 0) {
      activeSubscriptions.delete(channel);
    }
  } else {
    activeSubscriptions.delete(channel);
  }

  cacheLogger.debug("Unsubscribed from Pub/Sub channel", { channel });
}

/**
 * Gets the Pub/Sub status for health checks.
 *
 * @returns Pub/Sub status object
 */
export function getPubSubStatus(): PubSubStatus {
  const backend = getStorageBackend();
  const supported = canUsePubSub();
  const crossInstance = isPubSubSupported();

  // Count total subscriptions
  let subscriptionCount = 0;
  for (const handlers of activeSubscriptions.values()) {
    subscriptionCount += handlers.size;
  }

  return {
    supported,
    crossInstance,
    backend,
    subscriptionCount,
  };
}

/**
 * Closes all Pub/Sub connections and clears subscriptions.
 * Should be called during application shutdown.
 */
export function closePubSub(): void {
  activeSubscriptions.clear();
  cacheLogger.info("Pub/Sub connections closed");
}