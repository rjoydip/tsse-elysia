/**
 * Contract tests for Tasks API routes.
 * Tests auth enforcement on all task endpoints.
 * All task endpoints require authentication.
 */

import { describe, it, expect, afterAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";

const app = apiRoutes;

afterAll(() => {
  closeStorage();
});

describe("Tasks API", () => {
  describe("Auth enforcement", () => {
    it("GET /api/tasks should return 401 without auth", async () => {
      const response = await app.handle(new Request(`${BASE_URL}/api/tasks`));
      expect(response.status).toBe(401);
    });

    it("GET /api/tasks/stats should return 401 without auth", async () => {
      const response = await app.handle(new Request(`${BASE_URL}/api/tasks/stats`));
      expect(response.status).toBe(401);
    });

    it("GET /api/tasks/monthly should return 401 without auth", async () => {
      const response = await app.handle(new Request(`${BASE_URL}/api/tasks/monthly`));
      expect(response.status).toBe(401);
    });

    it("GET /api/tasks/:id should return 401 without auth", async () => {
      const response = await app.handle(new Request(`${BASE_URL}/api/tasks/some-id`));
      expect(response.status).toBe(401);
    });

    it("POST /api/tasks should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Test task" }),
        }),
      );
      expect(response.status).toBe(401);
    });

    it("PATCH /api/tasks/:id should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks/some-id`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Updated" }),
        }),
      );
      expect(response.status).toBe(401);
    });

    it("POST /api/tasks/:id/archive should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks/some-id/archive`, { method: "POST" }),
      );
      expect(response.status).toBe(401);
    });

    it("DELETE /api/tasks/:id should return 401 without auth", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks/some-id`, { method: "DELETE" }),
      );
      expect(response.status).toBe(401);
    });
  });
});