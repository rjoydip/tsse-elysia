/**
 * Unit tests for validateSession in src/controllers/shared/auth.ts.
 * Tests the TEST_AUTH_BYPASS path only.
 * Real auth path testing is covered by contract/integration tests
 * to avoid polluting the global vi.mock registry across test files.
 *
 * NOTE: vi.mock("~/lib/auth") is intentionally NOT used here because
 * it hoists to module scope and permanently replaces the module for
 * all subsequent files in the process, breaking contract tests that
 * depend on the real auth module.
 */

import { describe, it, expect, beforeEach } from "bun:test";

describe("validateSession", () => {
  const mockSet = { status: 200 as number | undefined, headers: {} as Record<string, string> };

  beforeEach(() => {
    delete process.env.TEST_AUTH_BYPASS;
    mockSet.status = 200;
  });

  describe("TEST_AUTH_BYPASS path", () => {
    it("should return mock session when TEST_AUTH_BYPASS is true", async () => {
      process.env.TEST_AUTH_BYPASS = "true";

      const { validateSession } = await import("~/controllers/shared/auth");
      const result = await validateSession(new Request("http://localhost"), mockSet);

      expect(result.error).toBeUndefined();
      expect(result.session).toBeDefined();
      expect(result.session!.userId).toBe("test-user-id");
      expect(result.session!.email).toBe("test@example.com");
    });

    it("should return 401 error when no TEST_AUTH_BYPASS and no session", async () => {
      const { validateSession } = await import("~/controllers/shared/auth");
      const result = await validateSession(new Request("http://localhost"), mockSet);

      // Without TEST_AUTH_BYPASS, the real auth module is used.
      // In unit test context, the module import will fail or return undefined.
      // The test verifies the function handles this gracefully.
      expect(result.session).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });
});