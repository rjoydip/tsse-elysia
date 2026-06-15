/**
 * Contract tests for Tasks API routes.
 * Tests auth enforcement on all task endpoints and happy-path flows
 * using TEST_AUTH_BYPASS for authenticated requests.
 */

import { describe, it, expect, afterAll, beforeEach, beforeAll } from "bun:test";
import { apiRoutes } from "~/routes/api/-app";
import { BASE_URL } from "~/test/helpers/request";
import { closeStorage } from "~/lib/cache";
import { registerSetup, cleanupPgliteDatabase } from "~/test/helpers/db-setup";

registerSetup();

const app = apiRoutes;

const TEST_USER_ID = "test-user-id";
const TEST_USER_EMAIL = "test@example.com";

/**
 * Creates a test user in the database so that FK constraints on the tasks
 * table are satisfied when TEST_AUTH_BYPASS inserts tasks.
 * Uses dynamic import of ~/config/db and schema to avoid static import
 * timing issues with Bun's top-level await in the db module.
 */
async function ensureTestUser(): Promise<void> {
  const { db } = await import("~/config/db");
  const { users } = await import("~/lib/db");
  const { tasks: tasksTable } = await import("~/lib/db");
  const { eq } = await import("drizzle-orm");

  // Clean up any tasks from previous test runs
  await db.delete(tasksTable).where(eq(tasksTable.userId, TEST_USER_ID));

  await db
    .insert(users)
    .values({
      id: TEST_USER_ID,
      name: "Test User",
      email: TEST_USER_EMAIL,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
}

afterAll(async () => {
  delete process.env.TEST_AUTH_BYPASS;
  closeStorage();
  await cleanupPgliteDatabase();
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

  describe("Happy path (TEST_AUTH_BYPASS)", () => {
    beforeAll(async () => {
      await ensureTestUser();
    });

    beforeEach(() => {
      process.env.TEST_AUTH_BYPASS = "true";
    });

    const authHeaders = {
      Authorization: "Bearer test-session-token",
      "Content-Type": "application/json",
    };

    it("GET /api/tasks should return 200 with empty list", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks`, { headers: authHeaders }),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body.tasks)).toBe(true);
    });

    it("GET /api/tasks/stats should return 200 with zeros", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks/stats`, { headers: authHeaders }),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.total).toBe(0);
    });

    it("GET /api/tasks/monthly should return 200 with 12 months", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks/monthly?year=2026`, { headers: authHeaders }),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.year).toBe(2026);
      expect(body.data).toHaveLength(12);
    });

    it("POST /api/tasks should create a task and return it", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ title: "Contract test task", priority: "high" }),
        }),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.title).toBe("Contract test task");
      expect(body.id).toBeDefined();
      expect(body.userId).toBeDefined();
    });

    it("POST -> PATCH -> GET :id : GET /:id should update and return task", async () => {
      const createResponse = await app.handle(
        new Request(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ title: "Task to update" }),
        }),
      );
      const task = await createResponse.json();
      const taskId = task.id;

      const patchResponse = await app.handle(
        new Request(`${BASE_URL}/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ title: "Updated title" }),
        }),
      );
      expect(patchResponse.status).toBe(200);
      const updated = await patchResponse.json();
      expect(updated.title).toBe("Updated title");

      const getResponse = await app.handle(
        new Request(`${BASE_URL}/api/tasks/${taskId}`, { headers: authHeaders }),
      );
      expect(getResponse.status).toBe(200);
      const fetched = await getResponse.json();
      expect(fetched.title).toBe("Updated title");
    });

    it("POST -> archive -> unarchive should toggle archived state", async () => {
      const createResponse = await app.handle(
        new Request(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ title: "Task to archive" }),
        }),
      );
      const task = await createResponse.json();

      const archiveResponse = await app.handle(
        new Request(`${BASE_URL}/api/tasks/${task.id}/archive`, {
          method: "POST",
          headers: authHeaders,
        }),
      );
      expect(archiveResponse.status).toBe(200);
      const archived = await archiveResponse.json();
      expect(archived.archivedAt).not.toBeNull();

      const unarchiveResponse = await app.handle(
        new Request(`${BASE_URL}/api/tasks/${task.id}/unarchive`, {
          method: "POST",
          headers: authHeaders,
        }),
      );
      expect(unarchiveResponse.status).toBe(200);
      const unarchived = await unarchiveResponse.json();
      expect(unarchived.archivedAt).toBeNull();
    });

    it("POST -> DELETE should soft-delete a task", async () => {
      const createResponse = await app.handle(
        new Request(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ title: "Task to delete" }),
        }),
      );
      const task = await createResponse.json();

      const deleteResponse = await app.handle(
        new Request(`${BASE_URL}/api/tasks/${task.id}`, {
          method: "DELETE",
          headers: authHeaders,
        }),
      );
      expect(deleteResponse.status).toBe(200);
      const deleted = await deleteResponse.json();
      expect(deleted.success).toBe(true);
    });

    it("PATCH /api/tasks/:id should return 404 for nonexistent task", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks/nonexistent-id`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ title: "Nope" }),
        }),
      );
      expect(response.status).toBe(404);
    });

    it("GET /api/tasks/:id should return 404 for nonexistent task", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/tasks/nonexistent-id`, { headers: authHeaders }),
      );
      expect(response.status).toBe(404);
    });
  });
});