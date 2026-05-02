/**
 * Unit tests for account repository with Result types.
 * Uses inline mocking to avoid database dependencies.
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { Result } from "~/lib/result";
import { AccountRepository } from "~/repositories/settings/account.repository";
import { NotFoundError } from "~/lib/result";

describe("Account Repository (Result Types)", () => {
  let repository: AccountRepository;
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

    repository = new AccountRepository(mockDb);
  });

  describe("findAccountByUserId", () => {
    test("should return Result.err with NotFoundError when not found", async () => {
      const result = await repository.findAccountByUserId("non-existent-user");

      expect(Result.isError(result)).toBe(true);
      if (Result.isError(result)) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error._tag).toBe("NotFoundError");
      }
    });

    test("should return Result.ok with account when found", async () => {
      const mockAccount = {
        id: "account-1",
        userId: "test-user-id",
        name: "Test User",
        dob: null,
        language: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Override mock to return data
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockAccount]),
          }),
        }),
      });

      const result = await repository.findAccountByUserId("test-user-id");

      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.userId).toBe("test-user-id");
      }
    });
  });

  describe("findUserById", () => {
    test("should return Result.err with NotFoundError when user not found", async () => {
      const result = await repository.findUserById("non-existent-user");

      expect(Result.isError(result)).toBe(true);
      if (Result.isError(result)) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    test("should return Result.ok with user data when found", async () => {
      const mockUser = { name: "Test User" };

      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockUser]),
          }),
        }),
      });

      const result = await repository.findUserById("test-user-id");

      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.name).toBe("Test User");
      }
    });
  });

  describe("createAccount", () => {
    test("should return ok(void) on success", async () => {
      const result = await repository.createAccount({
        userId: "test-user",
        name: "Test User",
        dob: null,
        language: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(Result.isOk(result)).toBe(true);
    });
  });

  describe("updateAccount", () => {
    test("should return Result.err with NotFoundError when account not found", async () => {
      // Mock findAccountByUserId to return NotFoundError
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const result = await repository.updateAccount("non-existent-user", {
        name: "Updated Name",
        dob: null,
        language: "fr",
        updatedAt: new Date(),
      });

      expect(Result.isError(result)).toBe(true);
      if (Result.isError(result)) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    test("should return ok(void) on success", async () => {
      // Mock findAccountByUserId to return success
      const mockAccount = {
        id: "account-1",
        userId: "test-user",
        name: "Test User",
        dob: null,
        language: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockAccount]),
          }),
        }),
      });

      const result = await repository.updateAccount("test-user", {
        name: "Updated Name",
        dob: null,
        language: "fr",
        updatedAt: new Date(),
      });

      expect(Result.isOk(result)).toBe(true);
    });
  });
});