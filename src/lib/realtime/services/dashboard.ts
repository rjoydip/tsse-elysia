/**
 * Real-time dashboard update service.
 * Handles optimistic updates, granular subscriptions, and backpressure handling.
 */

import { connectionStore } from "../stores/connection";
import { logger } from "~/lib/logger";

/**
 * Dashboard resource types.
 */
export type DashboardResource =
  | "stats"
  | "activity"
  | "metrics"
  | "users"
  | "documents"
  | "projects";

/**
 * Dashboard update actions.
 */
export type DashboardAction = "create" | "update" | "delete";

/**
 * Dashboard update interface.
 */
export interface DashboardUpdate {
  resource: DashboardResource;
  action: DashboardAction;
  data: unknown;
  timestamp: number;
}

/**
 * Subscription entry for tracking subscribers.
 */
interface SubscriptionEntry {
  connectionId: string;
  resources: Set<DashboardResource>;
}

/**
 * Backpressure queue entry.
 */
interface BackpressureEntry {
  connectionId: string;
  update: DashboardUpdate;
  queuedAt: number;
}

/**
 * Dashboard service implementation.
 */
class DashboardServiceImpl {
  private subscriptions = new Map<string, SubscriptionEntry>();
  private backpressureQueue: BackpressureEntry[] = [];
  private pendingUpdates = new Map<string, DashboardUpdate[]>();

  /**
   * Maximum queue size per connection.
   */
  private readonly MAX_QUEUE_SIZE = 100;

  /**
   * Maximum backpressure age (ms).
   */
  private readonly MAX_BACKPRESSURE_AGE = 5000;

  /**
   * Subscribes a connection to dashboard updates.
   *
   * @param connectionId - Connection identifier
   * @param resources - Resources to subscribe to
   */
  subscribe(connectionId: string, resources: DashboardResource[]): void {
    const existing = this.subscriptions.get(connectionId);

    if (existing) {
      for (const resource of resources) {
        existing.resources.add(resource);
      }
    } else {
      this.subscriptions.set(connectionId, {
        connectionId,
        resources: new Set(resources),
      });
    }

    logger.info(`Dashboard subscription: ${connectionId} -> [${resources.join(", ")}]`);
  }

  /**
   * Unsubscribes a connection from dashboard updates.
   *
   * @param connectionId - Connection identifier
   * @param resources - Resources to unsubscribe from (empty = all)
   */
  unsubscribe(connectionId: string, resources: DashboardResource[] = []): void {
    const existing = this.subscriptions.get(connectionId);
    if (!existing) return;

    if (resources.length === 0) {
      // Unsubscribe from all
      this.subscriptions.delete(connectionId);
    } else {
      for (const resource of resources) {
        existing.resources.delete(resource);
      }
      if (existing.resources.size === 0) {
        this.subscriptions.delete(connectionId);
      }
    }
  }

  /**
   * Broadcasts a dashboard update to subscribers.
   *
   * @param update - Dashboard update to broadcast
   */
  broadcast(update: DashboardUpdate): void {
    const data = JSON.stringify({
      type: "dashboard",
      update: {
        ...update,
        timestamp: update.timestamp || Date.now(),
      },
    });

    // Find all connections subscribed to this resource
    const subscribers: string[] = [];

    for (const [connectionId, sub] of this.subscriptions) {
      if (sub.resources.has(update.resource)) {
        const conn = connectionStore.get(connectionId);
        if (conn && conn.socket.readyState === 1) {
          // Check backpressure
          if (!this.checkBackpressure(connectionId)) {
            conn.socket.send(data);
            subscribers.push(connectionId);
          } else {
            // Queue for later
            this.queueUpdate(connectionId, update);
          }
        }
      }
    }

    logger.debug(`Dashboard broadcast: ${update.resource} -> ${subscribers.length} subscribers`);
  }

  /**
   * Checks if connection is under backpressure.
   *
   * @param connectionId - Connection identifier
   * @returns True if under backpressure
   */
  private checkBackpressure(connectionId: string): boolean {
    const queue = this.pendingUpdates.get(connectionId) || [];
    return queue.length >= this.MAX_QUEUE_SIZE;
  }

  /**
   * Queues an update for a connection under backpressure.
   *
   * @param connectionId - Connection identifier
   * @param update - Update to queue
   */
  private queueUpdate(connectionId: string, update: DashboardUpdate): void {
    let queue = this.pendingUpdates.get(connectionId);
    if (!queue) {
      queue = [];
      this.pendingUpdates.set(connectionId, queue);
    }

    queue.push(update);

    // Trim old updates if queue too large
    if (queue.length > this.MAX_QUEUE_SIZE) {
      queue.shift();
    }

    this.backpressureQueue.push({
      connectionId,
      update,
      queuedAt: Date.now(),
    });
  }

  /**
   * Flushes queued updates to connections.
   * Should be called periodically.
   */
  flush(): number {
    const now = Date.now();
    let flushed = 0;

    // Clean up old backpressure entries
    this.backpressureQueue = this.backpressureQueue.filter((entry) => {
      if (now - entry.queuedAt > this.MAX_BACKPRESSURE_AGE) {
        return false;
      }

      const conn = connectionStore.get(entry.connectionId);
      if (!conn || conn.socket.readyState !== 1) {
        return false;
      }

      const data = JSON.stringify({
        type: "dashboard",
        update: entry.update,
      });

      conn.socket.send(data);
      flushed++;

      return false;
    });

    return flushed;
  }

  /**
   * Sends an optimistic update to a user.
   *
   * @param userId - User identifier
   * @param update - Update to send
   */
  sendOptimistic(userId: string, update: DashboardUpdate): void {
    const data = JSON.stringify({
      type: "dashboard",
      update: {
        ...update,
        timestamp: update.timestamp || Date.now(),
        optimistic: true,
      },
    });

    connectionStore.sendToUser(userId, data);
  }

  /**
   * Creates a resource update.
   *
   * @param resource - Resource type
   * @param data - Resource data
   */
  notifyCreate(resource: DashboardResource, data: unknown): void {
    this.broadcast({
      resource,
      action: "create",
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Updates a resource.
   *
   * @param resource - Resource type
   * @param data - Updated data
   */
  notifyUpdate(resource: DashboardResource, data: unknown): void {
    this.broadcast({
      resource,
      action: "update",
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Deletes a resource.
   *
   * @param resource - Resource type
   * @param data - Deleted resource identifier or data
   */
  notifyDelete(resource: DashboardResource, data: unknown): void {
    this.broadcast({
      resource,
      action: "delete",
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Gets subscription count for a resource.
   *
   * @param resource - Resource type
   * @returns Number of subscribers
   */
  getSubscriberCount(resource: DashboardResource): number {
    let count = 0;
    for (const sub of this.subscriptions.values()) {
      if (sub.resources.has(resource)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Cleans up subscriptions for disconnected connections.
   *
   * @param connectionId - Connection identifier
   */
  cleanupConnection(connectionId: string): void {
    this.subscriptions.delete(connectionId);
    this.pendingUpdates.delete(connectionId);
  }
}

/**
 * Singleton dashboard service.
 */
export const dashboardService = new DashboardServiceImpl();