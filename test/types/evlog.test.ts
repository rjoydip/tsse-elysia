/**
 * Unit tests for src/types/evlog.ts
 * Tests: EvlogUser, EvlogSession, EvlogAuthSession, EvlogUserContext
 */

import { describe, expect, it } from "bun:test";
import type {
  EvlogUser,
  EvlogSession,
  EvlogAuthSession,
  EvlogUserContext,
} from "../../src/types/evlog";

describe("EvlogUser type", () => {
  it("should have required id property", () => {
    const user: EvlogUser = { id: "user-123" };
    expect(user.id).toBe("user-123");
  });

  it("should allow optional name property", () => {
    const user: EvlogUser = { id: "user-123", name: "John Doe" };
    expect(user.name).toBe("John Doe");
  });

  it("should allow optional email property", () => {
    const user: EvlogUser = { id: "user-123", email: "john@example.com" };
    expect(user.email).toBe("john@example.com");
  });

  it("should allow optional image property", () => {
    const user: EvlogUser = { id: "user-123", image: "https://example.com/avatar.png" };
    expect(user.image).toBe("https://example.com/avatar.png");
  });

  it("should allow optional emailVerified property", () => {
    const user: EvlogUser = { id: "user-123", emailVerified: true };
    expect(user.emailVerified).toBe(true);
  });

  it("should allow optional createdAt property", () => {
    const user: EvlogUser = { id: "user-123", createdAt: "2024-01-01T00:00:00Z" };
    expect(user.createdAt).toBe("2024-01-01T00:00:00Z");
  });

  it("should allow full user object", () => {
    const user: EvlogUser = {
      id: "user-123",
      name: "John Doe",
      email: "john@example.com",
      image: "https://example.com/avatar.png",
      emailVerified: true,
      createdAt: "2024-01-01T00:00:00Z",
    };
    expect(user.id).toBe("user-123");
    expect(user.name).toBe("John Doe");
    expect(user.email).toBe("john@example.com");
  });
});

describe("EvlogSession type", () => {
  it("should have required id property", () => {
    const session: EvlogSession = { id: "session-123" };
    expect(session.id).toBe("session-123");
  });

  it("should allow optional expiresAt property", () => {
    const session: EvlogSession = { id: "session-123", expiresAt: "2024-12-31T23:59:59Z" };
    expect(session.expiresAt).toBe("2024-12-31T23:59:59Z");
  });

  it("should allow optional ipAddress property", () => {
    const session: EvlogSession = { id: "session-123", ipAddress: "192.168.1.1" };
    expect(session.ipAddress).toBe("192.168.1.1");
  });

  it("should allow optional userAgent property", () => {
    const session: EvlogSession = { id: "session-123", userAgent: "Mozilla/5.0" };
    expect(session.userAgent).toBe("Mozilla/5.0");
  });

  it("should allow optional createdAt property", () => {
    const session: EvlogSession = { id: "session-123", createdAt: "2024-01-01T00:00:00Z" };
    expect(session.createdAt).toBe("2024-01-01T00:00:00Z");
  });

  it("should allow full session object", () => {
    const session: EvlogSession = {
      id: "session-123",
      expiresAt: "2024-12-31T23:59:59Z",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      createdAt: "2024-01-01T00:00:00Z",
    };
    expect(session.id).toBe("session-123");
    expect(session.ipAddress).toBe("192.168.1.1");
  });
});

describe("EvlogAuthSession type", () => {
  it("should require user and session properties", () => {
    const authSession: EvlogAuthSession = {
      user: { id: "user-123" },
      session: { id: "session-123" },
    };
    expect(authSession.user).toBeDefined();
    expect(authSession.session).toBeDefined();
  });

  it("should allow nested user and session objects", () => {
    const authSession: EvlogAuthSession = {
      user: {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        emailVerified: true,
      },
      session: {
        id: "session-123",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      },
    };
    expect(authSession.user.name).toBe("John Doe");
    expect(authSession.session.ipAddress).toBe("192.168.1.1");
  });
});

describe("EvlogUserContext type", () => {
  it("should have required userId property", () => {
    const context: EvlogUserContext = {
      userId: "user-123",
      user: { id: "user-123" },
      session: { id: "session-123" },
    };
    expect(context.userId).toBe("user-123");
  });

  it("should have required user property", () => {
    const context: EvlogUserContext = {
      userId: "user-123",
      user: { id: "user-123", name: "John Doe" },
      session: { id: "session-123" },
    };
    expect(context.user).toBeDefined();
    expect(context.user.name).toBe("John Doe");
  });

  it("should have required session property", () => {
    const context: EvlogUserContext = {
      userId: "user-123",
      user: { id: "user-123" },
      session: { id: "session-123", ipAddress: "192.168.1.1" },
    };
    expect(context.session).toBeDefined();
    expect(context.session.ipAddress).toBe("192.168.1.1");
  });

  it("should allow complete context object", () => {
    const context: EvlogUserContext = {
      userId: "user-123",
      user: {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        image: "https://example.com/avatar.png",
        emailVerified: true,
        createdAt: "2024-01-01T00:00:00Z",
      },
      session: {
        id: "session-123",
        expiresAt: "2024-12-31T23:59:59Z",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        createdAt: "2024-01-01T00:00:00Z",
      },
    };
    expect(context.userId).toBe("user-123");
    expect(context.user.email).toBe("john@example.com");
    expect(context.session.ipAddress).toBe("192.168.1.1");
  });
});

describe("Type compatibility", () => {
  it("should allow EvlogUser in EvlogAuthSession.user", () => {
    const user: EvlogUser = {
      id: "user-123",
      name: "John Doe",
      email: "john@example.com",
    };
    const authSession: EvlogAuthSession = {
      user,
      session: { id: "session-123" },
    };
    expect(authSession.user.name).toBe("John Doe");
  });

  it("should allow EvlogSession in EvlogAuthSession.session", () => {
    const session: EvlogSession = {
      id: "session-123",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    };
    const authSession: EvlogAuthSession = {
      user: { id: "user-123" },
      session,
    };
    expect(authSession.session.ipAddress).toBe("192.168.1.1");
  });

  it("should allow EvlogUser in EvlogUserContext.user", () => {
    const user: EvlogUser = {
      id: "user-123",
      name: "John Doe",
      email: "john@example.com",
    };
    const context: EvlogUserContext = {
      userId: "user-123",
      user,
      session: { id: "session-123" },
    };
    expect(context.user.name).toBe("John Doe");
  });

  it("should allow EvlogSession in EvlogUserContext.session", () => {
    const session: EvlogSession = {
      id: "session-123",
      ipAddress: "192.168.1.1",
    };
    const context: EvlogUserContext = {
      userId: "user-123",
      user: { id: "user-123" },
      session,
    };
    expect(context.session.ipAddress).toBe("192.168.1.1");
  });
});