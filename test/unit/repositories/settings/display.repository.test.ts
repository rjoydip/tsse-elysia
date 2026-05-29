/**
 * Unit tests for display repository with Result types.
 * Uses inline mocking to avoid database dependencies.
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { Result } from "~/lib/result";
import { DisplayRepository } from "~/repositories/settings/display.repository";
import { NotFoundError } from "~/lib/result";

describe("Display Repository (Result Types)", () => {
  let repository: DisplayRepository;
  let mockDb: any;

  beforeEach(() => {
    // Create mock database that returns empty results by default
    mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
      insert: () => ({
        values: () => Promise.resolve([]),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve([]),
        }),
      }),
    };

    repository = new DisplayRepository(mockDb);
  });

  describe("findDisplayByUserId", () => {
    test("should return Result.err with NotFoundError when not found", async () => {
      const result = await repository.findDisplayByUserId("non-existent-user");

      expect(Result.isError(result)).toBe(true);
      if (Result.isError(result)) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error._tag).toBe("NotFoundError");
      }
    });

    test("should return Result.ok with display settings when found", async () => {
      const mockDisplay = {
        id: "display-1",
        userId: "test-user-id",
        items: JSON.stringify(["recents", "home"]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Override mock to return data
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockDisplay]),
          }),
        }),
      });

      const result = await repository.findDisplayByUserId("test-user-id");

      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.userId).toBe("test-user-id");
      }
    });
  });

  describe("createDisplay", () => {
    test("should return ok(void) on success", async () => {
      const result = await repository.createDisplay({
        userId: "test-user",
        items: JSON.stringify(["recents", "home"]),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(Result.isOk(result)).toBe(true);
    });
  });

  describe("updateDisplay", () => {
    test("should return Result.err with NotFoundError when display not found", async () => {
      // Mock findDisplayByUserId to return NotFoundError (empty result)
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const result = await repository.updateDisplay("non-existent-user", {
        items: JSON.stringify(["custom"]),
        updatedAt: new Date(),
      });

      expect(Result.isError(result)).toBe(true);
      if (Result.isError(result)) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    test("should return ok(void) on success", async () => {
      // Mock findDisplayByUserId to return success
      const mockDisplay = {
        id: "display-1",
        userId: "test-user",
        items: JSON.stringify(["recents", "home"]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockDisplay]),
          }),
        }),
      });

      const result = await repository.updateDisplay("test-user", {
        items: JSON.stringify(["custom"]),
        updatedAt: new Date(),
      });

      expect(Result.isOk(result)).toBe(true);
    });
  });
});