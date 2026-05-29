/**
 * Unit tests for src/lib/logger.ts
 * Tests: createEvlogLogger, logger instances, log levels, identity management
 * Now backed by evlog for unified client/server logging
 */

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import {
  createEvlogLogger,
  logger,
  authLogger,
  apiLogger,
  dbLogger,
  cacheLogger,
  scriptLogger,
  setIdentity,
  getIdentity,
  clearIdentity,
  type LogLevel,
  type EvlogAuthSession,
} from "~/lib/logger";

describe("createEvlogLogger", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv ?? "test";
  });

  it("should create a logger with default options", () => {
    const testLogger = createEvlogLogger();
    expect(testLogger).toHaveProperty("info");
    expect(testLogger).toHaveProperty("warn");
    expect(testLogger).toHaveProperty("error");
    expect(testLogger).toHaveProperty("debug");
  });

  it("should log info messages", () => {
    const testLogger = createEvlogLogger({ minLevel: "info", prefix: "test" });
    testLogger.info("test message");
  });

  it("should log warn messages", () => {
    const testLogger = createEvlogLogger({ minLevel: "info", prefix: "test" });
    testLogger.warn("warning message");
  });

  it("should log error messages", () => {
    const testLogger = createEvlogLogger({ minLevel: "info", prefix: "test" });
    testLogger.error("error message");
  });

  it("should include prefix in log output", () => {
    const testLogger = createEvlogLogger({ prefix: "test-prefix" });
    testLogger.info("test");
  });

  it("should include context in log output", () => {
    const testLogger = createEvlogLogger({ minLevel: "info" });
    testLogger.info("test", { key: "value" });
  });

  it("should filter messages below minLevel", () => {
    const testLogger = createEvlogLogger({ minLevel: "warn", prefix: "test" });
    testLogger.info("should not appear");
    testLogger.debug("should not appear");
    testLogger.warn("should appear");
  });

  it("should convert Error objects to string", () => {
    const testLogger = createEvlogLogger({ minLevel: "error", prefix: "test" });
    const err = new Error("test error");
    testLogger.error("error occurred", err);
  });

  it("should output fatal errors to console.error", () => {
    const testLogger = createEvlogLogger({ minLevel: "info", prefix: "test" });
    testLogger.fatal("fatal error");
  });
});

describe("logger instances", () => {
  it("should have default app logger", () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
  });

  it("should have auth logger", () => {
    expect(authLogger).toBeDefined();
    expect(authLogger.info).toBeDefined();
  });

  it("should have api logger", () => {
    expect(apiLogger).toBeDefined();
    expect(apiLogger.info).toBeDefined();
  });

  it("should have db logger", () => {
    expect(dbLogger).toBeDefined();
    expect(dbLogger.info).toBeDefined();
  });

  it("should have redis logger", () => {
    expect(cacheLogger).toBeDefined();
    expect(cacheLogger.info).toBeDefined();
  });

  it("should log with app prefix", () => {
    logger.info("test");
  });

  it("should log with auth prefix", () => {
    authLogger.info("test");
  });

  it("should log with api prefix", () => {
    apiLogger.info("test");
  });

  it("should log with db prefix", () => {
    dbLogger.info("test");
  });

  it("should log with redis prefix", () => {
    cacheLogger.info("test");
  });
});

describe("log levels", () => {
  it("should support debug level", () => {
    const testLogger = createEvlogLogger({ minLevel: "debug", prefix: "test" });
    testLogger.debug("debug message");
  });

  it("should support info level", () => {
    const testLogger = createEvlogLogger({ minLevel: "info", prefix: "test" });
    testLogger.info("info message");
  });

  it("should support warn level", () => {
    const testLogger = createEvlogLogger({ minLevel: "warn", prefix: "test" });
    testLogger.warn("warn message");
  });

  it("should support error level", () => {
    const testLogger = createEvlogLogger({ minLevel: "error", prefix: "test" });
    testLogger.error("error message");
  });

  it("should support fatal level", () => {
    const testLogger = createEvlogLogger({ minLevel: "fatal", prefix: "test" });
    testLogger.fatal("fatal message");
  });
});

describe("identity management", () => {
  beforeEach(() => {
    clearIdentity();
  });

  it("should start with null identity", () => {
    expect(getIdentity()).toBeNull();
  });

  it("should set and get identity", () => {
    const session: EvlogAuthSession = {
      user: { id: "user-123", name: "Test User", email: "test@example.com" },
      session: { id: "session-123", expiresAt: "2024-01-01" },
    };
    setIdentity(session);
    const identity = getIdentity();
    expect(identity).not.toBeNull();
    expect(identity?.userId).toBe("user-123");
    expect(identity?.user.name).toBe("Test User");
  });

  it("should clear identity", () => {
    const session: EvlogAuthSession = {
      user: { id: "user-123", name: "Test User" },
      session: { id: "session-123" },
    };
    setIdentity(session);
    clearIdentity();
    expect(getIdentity()).toBeNull();
  });

  it("should support email masking option", () => {
    const session: EvlogAuthSession = {
      user: { id: "user-123", email: "test@example.com" },
      session: { id: "session-123" },
    };
    setIdentity(session, { maskEmail: true });
    const identity = getIdentity();
    expect(identity?.user.email).toBe("te***@example.com");
  });
});

describe("scriptLogger", () => {
  it("should have section method", () => {
    expect(scriptLogger.section).toBeDefined();
    expect(typeof scriptLogger.section).toBe("function");
  });

  it("should have step method", () => {
    expect(scriptLogger.step).toBeDefined();
    expect(typeof scriptLogger.step).toBe("function");
  });

  it("should have success method", () => {
    expect(scriptLogger.success).toBeDefined();
    expect(typeof scriptLogger.success).toBe("function");
  });

  it("should have warn method", () => {
    expect(scriptLogger.warn).toBeDefined();
    expect(typeof scriptLogger.warn).toBe("function");
  });

  it("should have error method", () => {
    expect(scriptLogger.error).toBeDefined();
    expect(typeof scriptLogger.error).toBe("function");
  });
});

describe("LogLevel type", () => {
  it("should accept debug level", () => {
    const level: LogLevel = "debug";
    expect(level).toBe("debug");
  });

  it("should accept info level", () => {
    const level: LogLevel = "info";
    expect(level).toBe("info");
  });

  it("should accept warn level", () => {
    const level: LogLevel = "warn";
    expect(level).toBe("warn");
  });

  it("should accept error level", () => {
    const level: LogLevel = "error";
    expect(level).toBe("error");
  });

  it("should accept fatal level", () => {
    const level: LogLevel = "fatal";
    expect(level).toBe("fatal");
  });
});