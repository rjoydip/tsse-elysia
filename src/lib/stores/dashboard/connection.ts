/**
 * Connection store for managing WebSocket connections.
 * Tracks connected users and their connection metadata.
 */

import type { ServerWebSocket } from "bun";
import { randomUUID } from "uncrypto";
import { logger } from "~/lib/logger";

/**
 * Metadata associated with each WebSocket connection.
 */
export interface ConnectionMetadata {
  /** Unique connection identifier */
  connectionId: string;
  /** User ID if authenticated */
  userId: string | null;
  /** User email if authenticated */
  email: string | null;
  /** Connection timestamp */
  connectedAt: number;
  /** Last heartbeat timestamp */
  lastHeartbeat: number;
  /** Number of missed heartbeats */
  missedHeartbeats: number;
  /** Remote IP address */
  remoteIp: string;
  /** User agent string */
  userAgent: string;
}

/**
 * WebSocket connection data structure.
 */
export interface WebSocketConnection {
  /** The WebSocket server instance */
  socket: ServerWebSocket<unknown>;
  /** Connection metadata */
  metadata: ConnectionMetadata;
}

/**
 * In-memory connection store.
 * Uses Map for O(1) lookups by connection ID.
 * For production scaling, consider Redis adapter.
 */
class ConnectionStoreImpl {
  private connections = new Map<string, WebSocketConnection>();
  private userConnections = new Map<string, Set<string>>();

  /**
   * Registers a new WebSocket connection.
   *
   * @param socket - The WebSocket server instance
   * @param userId - Optional user ID for authenticated connections
   * @param metadata - Additional connection metadata
   */
  register(
    socket: ServerWebSocket<unknown>,
    userId: string | null = null,
    metadata: Partial<ConnectionMetadata> = {},
  ): string {
    const connectionId = randomUUID();

    const connection: WebSocketConnection = {
      socket,
      metadata: {
        connectionId,
        userId,
        email: metadata.email || null,
        connectedAt: Date.now(),
        lastHeartbeat: Date.now(),
        missedHeartbeats: 0,
        remoteIp: socket.remoteAddress || "unknown",
        userAgent: "",
        ...metadata,
      },
    };

    this.connections.set(connectionId, connection);

    // Track user-to-connection mapping for user-specific messaging
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);
    }

    logger.info(`WebSocket connected: ${connectionId} ${userId ? `user:${userId}` : "anonymous"}`);

    return connectionId;
  }

  /**
   * Removes a connection from the store.
   *
   * @param connectionId - The connection identifier
   */
  unregister(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Clean up user mapping
    if (connection.metadata.userId) {
      const userConns = this.userConnections.get(connection.metadata.userId);
      if (userConns) {
        userConns.delete(connectionId);
        if (userConns.size === 0) {
          this.userConnections.delete(connection.metadata.userId);
        }
      }
    }

    this.connections.delete(connectionId);
    logger.info(`WebSocket disconnected: ${connectionId}`);
  }

  /**
   * Gets a connection by ID.
   *
   * @param connectionId - Connection identifier
   * @returns Connection if found, undefined otherwise
   */
  get(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Updates connection metadata.
   *
   * @param connectionId - Connection identifier
   * @param updates - Metadata fields to update
   */
  update(connectionId: string, updates: Partial<ConnectionMetadata>): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      Object.assign(connection.metadata, updates);
    }
  }

  /**
   * Gets all connections for a specific user.
   *
   * @param userId - User identifier
   * @returns Array of connections for the user
   */
  getByUser(userId: string): WebSocketConnection[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];
    return Array.from(connectionIds)
      .map((id: string) => this.connections.get(id))
      .filter((c): c is WebSocketConnection => c !== undefined);
  }

  /**
   * Gets all active connections.
   *
   * @returns Array of all connections
   */
  getAll(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Gets the count of active connections.
   *
   * @returns Total number of connections
   */
  getCount(): number {
    return this.connections.size;
  }

  /**
   * Gets the count of authenticated connections.
   *
   * @returns Number of authenticated users
   */
  getAuthenticatedCount(): number {
    return this.userConnections.size;
  }

  /**
   * Broadcasts a message to all connections.
   *
   * @param message - Message to broadcast
   */
  broadcast(message: unknown): void {
    const data = typeof message === "string" ? message : JSON.stringify(message);
    for (const connection of this.connections.values()) {
      if (connection.socket.readyState === 1) {
        connection.socket.send(data);
      }
    }
  }

  /**
   * Sends a message to a specific user.
   *
   * @param userId - User identifier
   * @param message - Message to send
   * @returns Number of connections messaged
   */
  sendToUser(userId: string, message: unknown): number {
    const connections = this.getByUser(userId);
    const data = typeof message === "string" ? message : JSON.stringify(message);
    let count = 0;

    for (const conn of connections) {
      if (conn.socket.readyState === 1) {
        conn.socket.send(data);
        count++;
      }
    }

    return count;
  }

  /**
   * Removes stale connections (timeout based).
   *
   * @param maxMissedHeartbeats - Maximum allowed missed heartbeats
   */
  cleanup(maxMissedHeartbeats: number = 5): string[] {
    const removed: string[] = [];

    for (const [id, conn] of this.connections) {
      if (conn.metadata.missedHeartbeats >= maxMissedHeartbeats) {
        conn.socket.close(1008, "Connection timeout");
        this.unregister(id);
        removed.push(id);
      }
    }

    return removed;
  }
}

/**
 * Singleton instance of the connection store.
 */
export const connectionStore = new ConnectionStoreImpl();