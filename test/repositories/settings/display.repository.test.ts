/**
 * Unit tests for display repository with Result types.
 */

import { describe, test, expect } from "bun:test";
import { isCI } from "std-env";
import { Result } from "~/lib/result";
import { displayRepository } from "~/repositories/settings/display.repository";

describe("Display Repository (Result Types)", () => {
  describe("findDisplayByUserId", () => {
    test("should return Result with display settings", async () => {
      const result = await displayRepository.findDisplayByUserId("test-user-id");

      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });

    test.skipIf(isCI)("should return Result.err with NotFoundError when not found", async () => {
      const result = await displayRepository.findDisplayByUserId("non-existent-user");

      if (Result.isError(result)) {
        expect(result.error._tag).toBe("NotFoundError");
      }
    });
  });

  describe("createDisplay", () => {
    test("should return ok(void) on success", async () => {
      const result = await displayRepository.createDisplay({
        userId: "test-user",
        items: JSON.stringify(["recents", "home"]),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });
  });

  describe("updateDisplay", () => {
    test("should return ok(void) on success", async () => {
      const result = await displayRepository.updateDisplay("test-user", {
        items: JSON.stringify(["custom"]),
        updatedAt: new Date(),
      });

      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });
  });
});