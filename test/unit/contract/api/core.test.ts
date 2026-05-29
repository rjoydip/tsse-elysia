/**
 * Contract tests for Eden Treaty type-safe client.
 * Validates that Elysia's Eden Treaty client correctly infers
 * types and returns expected responses from the API.
 *
 * These complement health.test.ts and endpoints.test.ts by testing
 * the client-server type contract rather than raw HTTP behavior.
 *
 * Only endpoints that exercise Eden Treaty's unique type inference
 * (e.g. nested route discrimination, typed data/error) are kept here.
 * Raw HTTP behavior for overlapping endpoints is covered by
 * health.test.ts, heartbeat.test.ts, and endpoints.test.ts.
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
});