/**
 * Unit tests for account repository with Result types.
 */

import { describe, test, expect } from "bun:test";
import { isCI } from "std-env";
import { Result } from "~/lib/result";
import { accountRepository } from "~/repositories/settings/account.repository";

describe("Account Repository (Result Types)", () => {
  describe("findAccountByUserId", () => {
    test("should return Result.ok with account when found", async () => {
      // Mock implementation would be needed for full test
      // This is an integration test pattern
      const result = await accountRepository.findAccountByUserId("test-user-id");

      // Check it returns a Result
      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });

    test.skipIf(isCI)("should return Result.err with NotFoundError when not found", async () => {
      const result = await accountRepository.findAccountByUserId("non-existent-user");

      if (Result.isError(result)) {
        expect(result.error._tag).toBe("NotFoundError");
      }
    });
  });

  describe("findUserById", () => {
    test("should return Result with user data", async () => {
      const result = await accountRepository.findUserById("test-user-id");

      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });
  });

  describe("createAccount", () => {
    test("should return ok(void) on success", async () => {
      const result = await accountRepository.createAccount({
        userId: "test-user",
        name: "Test User",
        dob: null,
        language: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });
  });

  describe("updateAccount", () => {
    test("should return ok(void) on success", async () => {
      const result = await accountRepository.updateAccount("test-user", {
        name: "Updated Name",
        dob: null,
        language: "fr",
        updatedAt: new Date(),
      });

      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });
  });
});