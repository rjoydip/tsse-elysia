/**
 * Unit tests for user repository.
 * Uses inline mocking to avoid database dependencies.
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { UserRepository } from "~/repositories/users";

describe("User Repository", () => {
  let repository: UserRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: () => ({
        from: () => ({
          where: () => {
            return {
              limit: () => Promise.resolve([]),
              orderBy: () => ({
                limit: () => Promise.resolve([]),
                offset: () => Promise.resolve([]),
              }),
            };
          },
        }),
      }),
    };

    repository = new UserRepository(mockDb);
  });

  describe("findById", () => {
    test("should return null when user not found", async () => {
      const result = await repository.findById("non-existent-id");

      expect(result).toBeNull();
    });

    test("should return user when found", async () => {
      const mockUser = { id: "user-1", email: "test@test.com", name: "Test" };

      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockUser]),
          }),
        }),
      });

      const result = await repository.findById("user-1");

      expect(result?.id).toBe("user-1");
    });
  });

  describe("findByEmail", () => {
    test("should return null when user not found", async () => {
      const result = await repository.findByEmail("notfound@test.com");

      expect(result).toBeNull();
    });

    test("should return user when found by email", async () => {
      const mockUser = { id: "user-1", email: "test@test.com", name: "Test" };

      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockUser]),
          }),
        }),
      });

      const result = await repository.findByEmail("test@test.com");

      expect(result?.email).toBe("test@test.com");
    });
  });

  describe("count", () => {
    test("should return count of users", async () => {
      mockDb.select = () => ({
        from: () => Promise.resolve([{ count: 2 }] as { count: number }[]),
      });

      const result = await repository.count();

      expect(result).toBe(2);
    });
  });
});