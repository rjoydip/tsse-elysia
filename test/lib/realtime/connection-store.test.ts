/**
 * Unit tests for realtime connection store.
 */

import { describe, expect, it, beforeEach } from "bun:test";
import { connectionStore } from "../../../src/lib/realtime/stores/connection";

describe("Connection Store", () => {
  // Mock WebSocket data for testing
  const mockSocket = {
    remoteAddress: "127.0.0.1",
    readyState: 1, // WebSocket.OPEN
    send: () => {},
    close: () => {},
  } as any;

  beforeEach(() => {
    // Clear all connections between tests
    const connections = connectionStore.getAll();
    for (const conn of connections) {
      connectionStore.unregister(conn.metadata.connectionId);
    }
  });

  describe("register", () => {
    it("should register a new connection", () => {
      const connectionId = connectionStore.register(mockSocket, "user-123");
      expect(connectionId).toBeDefined();
      expect(typeof connectionId).toBe("string");

      const conn = connectionStore.get(connectionId);
      expect(conn).toBeDefined();
      expect(conn?.metadata.userId).toBe("user-123");
    });

    it("should register anonymous connection without userId", () => {
      const connectionId = connectionStore.register(mockSocket, null);
      expect(connectionId).toBeDefined();

      const conn = connectionStore.get(connectionId);
      expect(conn?.metadata.userId).toBeNull();
    });

    it("should track connected at timestamp", () => {
      const before = Date.now();
      const connectionId = connectionStore.register(mockSocket, "user-123");
      const after = Date.now();

      const conn = connectionStore.get(connectionId);
      expect(conn?.metadata.connectedAt).toBeGreaterThanOrEqual(before);
      expect(conn?.metadata.connectedAt).toBeLessThanOrEqual(after);
    });
  });

  describe("unregister", () => {
    it("should remove connection from store", () => {
      const connectionId = connectionStore.register(mockSocket, "user-123");
      connectionStore.unregister(connectionId);

      const conn = connectionStore.get(connectionId);
      expect(conn).toBeUndefined();
    });

    it("should clean up user connection mapping", () => {
      const connectionId = connectionStore.register(mockSocket, "user-123");
      connectionStore.unregister(connectionId);

      const userConns = connectionStore.getByUser("user-123");
      expect(userConns).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("should update connection metadata", () => {
      const connectionId = connectionStore.register(mockSocket, "user-123");
      connectionStore.update(connectionId, { missedHeartbeats: 3 });

      const conn = connectionStore.get(connectionId);
      expect(conn?.metadata.missedHeartbeats).toBe(3);
    });
  });

  describe("getByUser", () => {
    it("should get all connections for a user", () => {
      connectionStore.register(mockSocket, "user-123");
      connectionStore.register(mockSocket, "user-123");

      const userConns = connectionStore.getByUser("user-123");
      expect(userConns).toHaveLength(2);
    });

    it("should return empty array for user with no connections", () => {
      const userConns = connectionStore.getByUser("nonexistent");
      expect(userConns).toHaveLength(0);
    });
  });

  describe("getAll / getCount", () => {
    it("should return all active connections", () => {
      connectionStore.register(mockSocket, "user-1");
      connectionStore.register(mockSocket, "user-2");

      const all = connectionStore.getAll();
      expect(all).toHaveLength(2);
      expect(connectionStore.getCount()).toBe(2);
    });

    it("should return authenticated user count", () => {
      connectionStore.register(mockSocket, "user-1");
      connectionStore.register(mockSocket, "user-2");
      connectionStore.register(mockSocket, null); // anonymous

      expect(connectionStore.getAuthenticatedCount()).toBe(2);
    });
  });

  describe("broadcast", () => {
    it("should broadcast message to all connections", () => {
      const sent: string[] = [];
      const mockSocket1 = { ...mockSocket, send: (msg: string) => sent.push(msg) } as any;
      const mockSocket2 = { ...mockSocket, send: (msg: string) => sent.push(msg) } as any;

      connectionStore.register(mockSocket1, "user-1");
      connectionStore.register(mockSocket2, "user-2");

      connectionStore.broadcast("test message");

      expect(sent).toHaveLength(2);
      expect(sent[0]).toBe("test message");
    });
  });

  describe("sendToUser", () => {
    it("should send message to specific user", () => {
      const sent: string[] = [];
      const mockSocket1 = { ...mockSocket, send: (msg: string) => sent.push(msg) } as any;
      const mockSocket2 = { ...mockSocket, send: (msg: string) => sent.push(msg) } as any;

      connectionStore.register(mockSocket1, "user-1");
      connectionStore.register(mockSocket2, "user-2");

      connectionStore.sendToUser("user-1", "hello user-1");

      expect(sent).toHaveLength(1);
      expect(sent[0]).toBe("hello user-1");
    });
  });

  describe("cleanup", () => {
    it("should remove connections exceeding missed heartbeat limit", () => {
      const connectionId = connectionStore.register(mockSocket, "user-123");
      connectionStore.update(connectionId, { missedHeartbeats: 10 });

      const removed = connectionStore.cleanup(5);

      expect(removed).toContain(connectionId);
      expect(connectionStore.get(connectionId)).toBeUndefined();
    });
  });
});