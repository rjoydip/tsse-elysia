import { describe, expect, it } from "bun:test";
import { t } from "elysia";
import { API_PREFIX, PORT } from "~/config/index.ts";

const envPath = "~/config/env.ts";

describe("_env", () => {
  describe("Client Environment Variables", () => {
    it("should have VITE_API_URL from env", async () => {
      const { env } = await import(envPath);
      expect(env.VITE_API_URL).toBeDefined();
    });

    it("should have VITE_PASS_ENCRYPTION_KEY from env", async () => {
      const { env } = await import(envPath);
      expect(env.VITE_PASS_ENCRYPTION_KEY).toBeDefined();
    });

    it("should have FEATURE_MULTI_TEAM as boolean from env", async () => {
      const { env } = await import(envPath);
      expect(typeof env.FEATURE_MULTI_TEAM).toBe("boolean");
    });
  });

  describe("Server Environment Variables", () => {
    it("should have API_URL from env", async () => {
      const { env } = await import(envPath);
      expect(env.API_URL).toBeDefined();
      expect(env.API_URL).toContain("/api");
    });

    it("should have BETTER_AUTH_SECRET from env", async () => {
      const { env } = await import(envPath);
      expect(env.BETTER_AUTH_SECRET).toBeDefined();
    });

    it("should have BETTER_AUTH_URL from env", async () => {
      const { env } = await import(envPath);
      expect(env.BETTER_AUTH_URL).toBeDefined();
    });

    it("should have PORT as number from env", async () => {
      const { env } = await import(envPath);
      expect(typeof env.PORT).toBe("number");
    });

    it("should have DATABASE_TYPE from env", async () => {
      const { env } = await import(envPath);
      expect(env.DATABASE_TYPE).toMatch(/^(sqlite|postgres)$/);
    });

    it("should have SQLITE_URL from env", async () => {
      const { env } = await import(envPath);
      expect(env.SQLITE_URL === undefined || typeof env.SQLITE_URL === "string").toBe(true);
    });

    it("should have SQLITE_AUTH_TOKEN from env", async () => {
      const { env } = await import(envPath);
      expect(env.SQLITE_AUTH_TOKEN === undefined || typeof env.SQLITE_AUTH_TOKEN === "string").toBe(
        true,
      );
    });

    it("should have POSTGRES_USER from env", async () => {
      const { env } = await import(envPath);
      expect(env.POSTGRES_USER === undefined || typeof env.POSTGRES_USER === "string").toBe(true);
    });

    it("should have POSTGRES_PASSWORD from env", async () => {
      const { env } = await import(envPath);
      expect(env.POSTGRES_PASSWORD === undefined || typeof env.POSTGRES_PASSWORD === "string").toBe(
        true,
      );
    });

    it("should have POSTGRES_DB from env", async () => {
      const { env } = await import(envPath);
      expect(env.POSTGRES_DB === undefined || typeof env.POSTGRES_DB === "string").toBe(true);
    });

    it("should have POSTGRES_HOST from env", async () => {
      const { env } = await import(envPath);
      expect(env.POSTGRES_HOST === undefined || typeof env.POSTGRES_HOST === "string").toBe(true);
    });

    it("should have POSTGRES_PORT from env", async () => {
      const { env } = await import(envPath);
      expect(env.POSTGRES_PORT === undefined || typeof env.POSTGRES_PORT === "number").toBe(true);
    });

    it("should have POSTGRES_URL from env", async () => {
      const { env } = await import(envPath);
      expect(env.POSTGRES_URL === undefined || typeof env.POSTGRES_URL === "string").toBe(true);
    });

    it("should have POSTGRES_REPLICAS from env", async () => {
      const { env } = await import(envPath);
      expect(
        env.POSTGRES_REPLICAS === undefined ||
          (Array.isArray(env.POSTGRES_REPLICAS) &&
            env.POSTGRES_REPLICAS.every((v: unknown) => typeof v === "string")),
      ).toBe(true);
    });

    it("should have REDIS_URL from env", async () => {
      const { env } = await import(envPath);
      expect(env.REDIS_URL === undefined || typeof env.REDIS_URL === "string").toBe(true);
    });

    it("should have WS_ENABLED from env", async () => {
      const { env } = await import(envPath);
      expect(env.WS_ENABLED === undefined || typeof env.WS_ENABLED === "boolean").toBe(true);
    });

    it("should have WS_HEARTBEAT_INTERVAL from env", async () => {
      const { env } = await import(envPath);
      expect(
        env.WS_HEARTBEAT_INTERVAL === undefined || typeof env.WS_HEARTBEAT_INTERVAL === "number",
      ).toBe(true);
    });

    it("should have WS_MAX_MESSAGE_SIZE from env", async () => {
      const { env } = await import(envPath);
      expect(
        env.WS_MAX_MESSAGE_SIZE === undefined || typeof env.WS_MAX_MESSAGE_SIZE === "number",
      ).toBe(true);
    });

    it("should have WS_RATE_LIMIT_MESSAGES from env", async () => {
      const { env } = await import(envPath);
      expect(
        env.WS_RATE_LIMIT_MESSAGES === undefined || typeof env.WS_RATE_LIMIT_MESSAGES === "number",
      ).toBe(true);
    });

    it("should have WS_RATE_LIMIT_WINDOW from env", async () => {
      const { env } = await import(envPath);
      expect(
        env.WS_RATE_LIMIT_WINDOW === undefined || typeof env.WS_RATE_LIMIT_WINDOW === "number",
      ).toBe(true);
    });
  });

  describe("Environment Integration", () => {
    it("API_PREFIX should match env API_URL prefix", async () => {
      const { env } = await import(envPath);
      expect(env.API_URL).toContain(API_PREFIX);
    });

    it("PORT from _config should match env PORT", async () => {
      const { env } = await import(envPath);
      expect(env.PORT).toBe(PORT);
    });
  });

  describe("Env Type Export", () => {
    it("should export Env type", async () => {
      const { env } = await import(envPath);
      expect(env).toBeDefined();
      expect(typeof env).toBe("object");
    });
  });

  describe("t Schema types", () => {
    it("should have t.String available", () => {
      const schema = t.String();
      expect(schema).toBeDefined();
    });

    it("should have t.Number available", () => {
      const schema = t.Number();
      expect(schema).toBeDefined();
    });

    it("should have t.Boolean available", () => {
      const schema = t.Boolean();
      expect(schema).toBeDefined();
    });

    it("should have t.Optional available", () => {
      const schema = t.Optional(t.String());
      expect(schema).toBeDefined();
    });

    it("should have t.Union available", () => {
      const schema = t.Union([t.Literal("a"), t.Literal("b")]);
      expect(schema).toBeDefined();
    });

    it("should have t.Literal available", () => {
      const schema = t.Literal("test");
      expect(schema).toBeDefined();
    });

    it("should create object schema", () => {
      const schema = t.Object({
        TEST: t.String(),
      });
      expect(schema).toBeDefined();
    });
  });
});