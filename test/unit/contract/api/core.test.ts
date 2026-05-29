/**
 * Contract tests for Eden Treaty type-safe client.
 * Validates that Elysia's Eden Treaty client correctly infers
 * types and returns expected responses from the API.
 *
 * These complement health.test.ts and endpoints.test.ts by testing
 * the client-server type contract rather than raw HTTP behavior.
 */
import { describe, it, expect, afterAll } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { apiRoutes } from "~/routes/api/-app";
import { closeStorage } from "~/lib/cache";

afterAll(() => {
  closeStorage();
});

const api = treaty(apiRoutes);

describe("Eden Treaty - API Endpoints", () => {
  describe("GET /api", () => {
    it("should return welcome message", async () => {
      const { data, error, status } = await api.api.get();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).toContain("Welcome to");
    });

    it("should return text/plain content type", async () => {
      const { response } = await api.api.get();

      expect(response.headers.get("content-type")).toMatch(/text\/plain/);
    });
  });

  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const { data, error, status } = await api.api.health.get();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).toHaveProperty("status", "healthy");
    });

    it("should return name in health response", async () => {
      const { data, error } = await api.api.health.get();

      expect(error).toBeNull();
      expect(data).toHaveProperty("name");
      expect(typeof (data as { name?: string })?.name).toBe("string");
    });

    it("should return json content type", async () => {
      const { response } = await api.api.health.get();

      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("GET /api/realtime", () => {
    it("should return websocket discovery metadata", async () => {
      const { data, error, status } = await api.api.realtime.get();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).toHaveProperty("websocketEndpoint", "/api/ws");
      expect(data).toHaveProperty("healthEndpoint", "/api/realtime/health");
      expect(data).toHaveProperty("requiresAuth", true);
    });
  });

  describe("GET /api/realtime/health", () => {
    it("should return realtime health payload", async () => {
      const { data, error, status } = await api.api.realtime.health.get();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).toHaveProperty("status", "healthy");
      expect(data).toHaveProperty("websocketPath", "/api/ws");
      expect(data).toHaveProperty("totalConnections");
      expect(data).toHaveProperty("authenticatedConnections");
      expect(data).toHaveProperty("timestamp");
    });
  });

  describe("GET /api/database/heartbeat", () => {
    it("should return database heartbeat payload", async () => {
      const { data, error, status } = await api.api.database.heartbeat.get();

      expect(error).toBeNull();
      expect([200, 503]).toContain(status);
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("detail");
      expect(data?.status).toBeDefined();
    });
  });
});