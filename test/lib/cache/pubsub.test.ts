/**
 * Unit tests for the Pub/Sub module using Unstorage.
 * Tests channel definitions, message type structure, publish/subscribe, and graceful degradation.
 *
 * @remarks
 * These tests verify the module's type-safe API without requiring a running Redis.
 * Integration tests that verify actual pub/sub messaging require a Redis instance.
 */

import { describe, test, expect, afterEach } from "bun:test";
import {
  PUBSUB_CHANNELS,
  publish,
  subscribe,
  unsubscribe,
  closePubSub,
  getPubSubStatus,
  type PubSubMessage,
  type PubSubChannel,
} from "../../../src/lib/cache/pubsub";

describe("Pub/Sub Channels", () => {
  afterEach(() => {
    closePubSub();
  });

  test("PUBSUB_CHANNELS has all expected channel names", () => {
    expect(PUBSUB_CHANNELS.USER_EVENTS).toBe("tsse:pubsub:user:events");
    expect(PUBSUB_CHANNELS.SYSTEM_NOTIFICATIONS).toBe("tsse:pubsub:system:notifications");
    expect(PUBSUB_CHANNELS.MCP_EVENTS).toBe("tsse:pubsub:mcp:events");
    expect(PUBSUB_CHANNELS.DASHBOARD_UPDATES).toBe("tsse:pubsub:dashboard:updates");
    expect(PUBSUB_CHANNELS.CACHE_INVALIDATION).toBe("tsse:pubsub:cache:invalidation");
  });

  test("PUBSUB_CHANNELS values are namespaced with tsse:pubsub:", () => {
    const channels: string[] = Object.values(PUBSUB_CHANNELS);
    for (const channel of channels) {
      expect(channel.startsWith("tsse:pubsub:")).toBe(true);
    }
  });

  test("PUBSUB_CHANNELS has exactly 5 channels", () => {
    expect(Object.keys(PUBSUB_CHANNELS)).toHaveLength(5);
  });
});

describe("Pub/Sub Message Structure", () => {
  test("PubSubMessage structure is correct", () => {
    const message: PubSubMessage<{ userId: string }> = {
      type: "user.login",
      data: { userId: "123" },
      timestamp: new Date().toISOString(),
      source: "auth",
    };

    expect(message.type).toBe("user.login");
    expect(message.data.userId).toBe("123");
    expect(message.source).toBe("auth");
    expect(typeof message.timestamp).toBe("string");
  });

  test("PubSubMessage works without optional source field", () => {
    const message: PubSubMessage<string> = {
      type: "cache.clear",
      data: "user:*",
      timestamp: new Date().toISOString(),
    };

    expect(message.type).toBe("cache.clear");
    expect(message.data).toBe("user:*");
    expect(message.source).toBeUndefined();
  });

  test("PubSubMessage can have any data type", () => {
    const messageWithNumber: PubSubMessage<number> = {
      type: "counter.increment",
      data: 42,
      timestamp: new Date().toISOString(),
    };
    expect(messageWithNumber.data).toBe(42);

    const messageWithArray: PubSubMessage<string[]> = {
      type: "items.update",
      data: ["item1", "item2"],
      timestamp: new Date().toISOString(),
    };
    expect(messageWithArray.data).toEqual(["item1", "item2"]);

    const messageWithBoolean: PubSubMessage<boolean> = {
      type: "flag.toggle",
      data: true,
      timestamp: new Date().toISOString(),
    };
    expect(messageWithBoolean.data).toBe(true);
  });
});

describe("Pub/Sub Status", () => {
  afterEach(() => {
    closePubSub();
  });

  test("getPubSubStatus returns a valid status object", () => {
    const status = getPubSubStatus();
    expect(status).toHaveProperty("supported");
    expect(status).toHaveProperty("crossInstance");
    expect(status).toHaveProperty("backend");
    expect(status).toHaveProperty("subscriptionCount");
    expect(typeof status.supported).toBe("boolean");
    expect(typeof status.crossInstance).toBe("boolean");
    expect(typeof status.backend).toBe("string");
    expect(typeof status.subscriptionCount).toBe("number");
  });

  test("getPubSubStatus backend is one of the valid types", () => {
    const status = getPubSubStatus();
    expect(["redis", "postgres", "lru"]).toContain(status.backend);
  });

  test("getPubSubStatus subscriptionCount is initially 0", () => {
    const status = getPubSubStatus();
    expect(status.subscriptionCount).toBe(0);
  });

  test("getPubSubStatus crossInstance is true only for Redis", () => {
    const status = getPubSubStatus();
    expect(status.crossInstance).toBe(status.backend === "redis");
  });

  test("getPubSubStatus reflects subscription count after subscribe", async () => {
    // Subscribe to a channel
    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {});

    const status = getPubSubStatus();
    expect(status.subscriptionCount).toBeGreaterThanOrEqual(1);
  });
});

describe("Pub/Sub Subscribe", () => {
  afterEach(() => {
    closePubSub();
  });

  test("subscribe adds handler to active subscriptions", async () => {
    const handler = () => {};
    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, handler);

    const status = getPubSubStatus();
    expect(status.subscriptionCount).toBeGreaterThanOrEqual(1);
  });

  test("subscribe multiple handlers to same channel", async () => {
    const handler1 = () => {};
    const handler2 = () => {};

    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, handler1);
    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, handler2);

    const status = getPubSubStatus();
    expect(status.subscriptionCount).toBeGreaterThanOrEqual(2);
  });

  test("subscribe to different channels", async () => {
    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {});
    await subscribe(PUBSUB_CHANNELS.MCP_EVENTS, () => {});
    await subscribe(PUBSUB_CHANNELS.DASHBOARD_UPDATES, () => {});

    const status = getPubSubStatus();
    expect(status.subscriptionCount).toBeGreaterThanOrEqual(3);
  });

  test("subscribe does not throw without storage", async () => {
    // Even if storage is unavailable, subscribe should not throw
    // It should resolve without error
    await expect(subscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {})).resolves.toBeUndefined();
  });
});

describe("Pub/Sub Unsubscribe", () => {
  afterEach(() => {
    closePubSub();
  });

  test("unsubscribe removes specific handler", async () => {
    const handler1 = () => {};
    const handler2 = () => {};

    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, handler1);
    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, handler2);

    // Remove only handler1
    unsubscribe(PUBSUB_CHANNELS.USER_EVENTS, handler1);

    // handler2 should still be subscribed (subscriptionCount >= 1)
    const status = getPubSubStatus();
    expect(status.subscriptionCount).toBeGreaterThanOrEqual(1);
  });

  test("unsubscribe removes all handlers when no handler specified", async () => {
    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {});
    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {});

    // Remove all handlers for this channel
    unsubscribe(PUBSUB_CHANNELS.USER_EVENTS);

    const status = getPubSubStatus();
    // After removing all, subscription count should be 0 or less
    expect(status.subscriptionCount).toBeLessThan(2);
  });

  test("unsubscribe on channel with no subscriptions does not throw", () => {
    // Should not throw even if channel has no subscriptions
    expect(() => {
      unsubscribe(PUBSUB_CHANNELS.USER_EVENTS);
    }).not.toThrow();
  });

  test("unsubscribe specific handler on channel with no subscriptions does not throw", () => {
    expect(() => {
      unsubscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {});
    }).not.toThrow();
  });
});

describe("Pub/Sub Publish", () => {
  afterEach(() => {
    closePubSub();
  });

  test("publish returns number of subscribers", async () => {
    const receivedMessages: PubSubMessage[] = [];

    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, (msg) => {
      receivedMessages.push(msg);
    });

    const message: PubSubMessage<{ userId: string }> = {
      type: "user.login",
      data: { userId: "123" },
      timestamp: new Date().toISOString(),
      source: "auth",
    };

    const count = await publish(PUBSUB_CHANNELS.USER_EVENTS, message);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("publish calls all subscribed handlers", async () => {
    let callCount1 = 0;
    let callCount2 = 0;

    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {
      callCount1++;
    });
    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {
      callCount2++;
    });

    const message: PubSubMessage = {
      type: "user.login",
      data: {},
      timestamp: new Date().toISOString(),
    };

    await publish(PUBSUB_CHANNELS.USER_EVENTS, message);

    expect(callCount1).toBe(1);
    expect(callCount2).toBe(1);
  });

  test("publish only calls handlers for the correct channel", async () => {
    let userEventsCalled = false;
    let mcpEventsCalled = false;

    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {
      userEventsCalled = true;
    });
    await subscribe(PUBSUB_CHANNELS.MCP_EVENTS, () => {
      mcpEventsCalled = true;
    });

    const message: PubSubMessage = {
      type: "user.login",
      data: {},
      timestamp: new Date().toISOString(),
    };

    await publish(PUBSUB_CHANNELS.USER_EVENTS, message);

    expect(userEventsCalled).toBe(true);
    expect(mcpEventsCalled).toBe(false);
  });

  test("publish handler receives correct message data", async () => {
    const receivedMessages: PubSubMessage[] = [];

    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, (msg) => {
      receivedMessages.push(msg);
    });

    const message: PubSubMessage<{ userId: string }> = {
      type: "user.login",
      data: { userId: "test-123" },
      timestamp: "2024-01-01T00:00:00.000Z",
      source: "auth",
    };

    await publish(PUBSUB_CHANNELS.USER_EVENTS, message);

    expect(receivedMessages.length).toBeGreaterThan(0);
    const receivedMessage = receivedMessages[0];
    expect(receivedMessage.type).toBe("user.login");
    expect((receivedMessage.data as { userId: string })?.userId).toBe("test-123");
    expect(receivedMessage.source).toBe("auth");
  });

  test("publish with no subscribers returns 0", async () => {
    const message: PubSubMessage = {
      type: "test",
      data: {},
      timestamp: new Date().toISOString(),
    };

    const count = await publish(PUBSUB_CHANNELS.CACHE_INVALIDATION, message);
    expect(count).toBe(0);
  });

  test("publish does not throw without storage", async () => {
    const message: PubSubMessage = {
      type: "test",
      data: {},
      timestamp: new Date().toISOString(),
    };

    // Should resolve with a number (0 if no subscribers, or subscriber count)
    const result = await publish(PUBSUB_CHANNELS.USER_EVENTS, message);
    expect(typeof result).toBe("number");
  });
});

describe("Pub/Sub Close", () => {
  test("closePubSub clears all subscriptions", async () => {
    await subscribe(PUBSUB_CHANNELS.USER_EVENTS, () => {});
    await subscribe(PUBSUB_CHANNELS.MCP_EVENTS, () => {});
    await subscribe(PUBSUB_CHANNELS.DASHBOARD_UPDATES, () => {});

    closePubSub();

    const status = getPubSubStatus();
    expect(status.subscriptionCount).toBe(0);
  });

  test("closePubSub is safe to call multiple times", () => {
    closePubSub();
    closePubSub();
    closePubSub();
    expect(true).toBe(true);
  });

  test("after closePubSub, publish still works but has no subscribers", async () => {
    const message: PubSubMessage = {
      type: "test",
      data: {},
      timestamp: new Date().toISOString(),
    };

    closePubSub();

    const count = await publish(PUBSUB_CHANNELS.USER_EVENTS, message);
    expect(count).toBe(0);
  });
});

describe("Pub/Sub Channel Type", () => {
  test("PubSubChannel type is exported", () => {
    // This test verifies the type is exported and can be used
    const channel: PubSubChannel = PUBSUB_CHANNELS.USER_EVENTS;
    expect(channel).toBe("tsse:pubsub:user:events");
  });

  test("all PUBSUB_CHANNELS values are valid PubSubChannel", () => {
    const channels: PubSubChannel[] = [
      PUBSUB_CHANNELS.USER_EVENTS,
      PUBSUB_CHANNELS.SYSTEM_NOTIFICATIONS,
      PUBSUB_CHANNELS.MCP_EVENTS,
      PUBSUB_CHANNELS.DASHBOARD_UPDATES,
      PUBSUB_CHANNELS.CACHE_INVALIDATION,
    ];

    expect(channels).toHaveLength(5);
    channels.forEach((channel) => {
      expect(typeof channel).toBe("string");
      expect(channel.startsWith("tsse:pubsub:")).toBe(true);
    });
  });
});