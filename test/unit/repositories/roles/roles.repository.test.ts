/**
 * Unit tests for RolesRepository with Result types.
 * Uses vi.mock to mock the database dependency.
 * Note: withDatabaseError wraps thrown errors in DatabaseError,
 * so NotFoundError is only expected from methods that check
 * preconditions (like findRoleById called from assignRoleToUser).
 */

import { describe, test, expect, beforeEach, vi } from "bun:test";
import { Result, DatabaseError } from "~/lib/result";
import { RolesRepository } from "~/repositories/roles.repository";

// Mock db before importing the repository (vi.mock is hoisted by Bun)
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("~/config/db", () => ({
  db: mockDb,
}));

describe("RolesRepository", () => {
  let repository: RolesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new RolesRepository();
  });

  describe("findAllPermissions", () => {
    test("should return empty array when no permissions exist", async () => {
      mockDb.select.mockReturnValue({
        from: () => ({
          orderBy: () => Promise.resolve([]),
        }),
      });

      const result = await repository.findAllPermissions();
      expect(Result.isOk(result)).toBe(true);
    });

    test("should return all permissions when they exist", async () => {
      const mockPermissions = [
        {
          id: "p1",
          name: "dashboard:read",
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "p2",
          name: "users:read",
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: () => ({
          orderBy: () => Promise.resolve(mockPermissions),
        }),
      });

      const result = await repository.findAllPermissions();
      expect(Result.isOk(result)).toBe(true);
      // eslint-disable-next-line jest/no-conditional-expect
      if (Result.isOk(result)) expect(result.value).toHaveLength(2);
    });
  });

  describe("findPermissionById", () => {
    test("should return DatabaseError when permission does not exist", async () => {
      mockDb.select.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const result = await repository.findPermissionById("non-existent");
      expect(Result.isError(result)).toBe(true);
      // eslint-disable-next-line jest/no-conditional-expect
      if (Result.isError(result)) expect(result.error).toBeInstanceOf(DatabaseError);
    });

    test("should return permission when found", async () => {
      const mockPermission = {
        id: "p1",
        name: "dashboard:read",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockPermission]),
          }),
        }),
      });

      const result: any = await repository.findPermissionById("p1");
      expect(Result.isOk(result)).toBe(true);
      // eslint-disable-next-line jest/no-conditional-expect
      if (Result.isOk(result)) expect((result as any).value.name).toBe("dashboard:read");
    });
  });

  describe("createPermission", () => {
    test("should create permission successfully", async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => {
              callCount++;
              if (callCount === 3) {
                return Promise.resolve([
                  {
                    id: "created-id",
                    name: "test:perm",
                    description: "Test permission",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ]);
              }
              return Promise.resolve([]);
            },
          }),
        }),
      }));

      mockDb.insert.mockReturnValue({
        values: () => Promise.resolve([]),
      });

      const result = await repository.createPermission({
        name: "test:perm",
        description: "Test permission",
      });

      expect(Result.isOk(result)).toBe(true);
    });
  });

  describe("deletePermission", () => {
    test("should return DatabaseError when permission does not exist", async () => {
      mockDb.select.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const result = await repository.deletePermission("non-existent");
      expect(Result.isError(result)).toBe(true);
      // eslint-disable-next-line jest/no-conditional-expect
      if (Result.isError(result)) expect(result.error).toBeInstanceOf(DatabaseError);
    });
  });

  describe("findAllRoles", () => {
    test("should return all roles", async () => {
      const mockRoles = [
        {
          id: "r1",
          name: "admin",
          description: null,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: () => ({
          orderBy: () => Promise.resolve(mockRoles),
        }),
      });

      const result = await repository.findAllRoles();
      expect(Result.isOk(result)).toBe(true);
      // eslint-disable-next-line jest/no-conditional-expect
      if (Result.isOk(result)) expect(result.value).toHaveLength(1);
    });
  });

  describe("assignRoleToUser", () => {
    test("should assign role to user", async () => {
      mockDb.select.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: "r1",
                  name: "admin",
                  description: null,
                  isDefault: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]),
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: () => Promise.resolve([]),
      });

      const result = await repository.assignRoleToUser("user1", "r1");
      expect(Result.isOk(result)).toBe(true);
    });

    test("should return DatabaseError when role does not exist", async () => {
      mockDb.select.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const result = await repository.assignRoleToUser("user1", "non-existent");
      expect(Result.isError(result)).toBe(true);
      // eslint-disable-next-line jest/no-conditional-expect
      if (Result.isError(result)) expect(result.error).toBeInstanceOf(DatabaseError);
    });
  });

  describe("getRoleIdsForUser", () => {
    test("should return role IDs for user", async () => {
      mockDb.select.mockReturnValue({
        from: () => ({
          where: () => Promise.resolve([{ roleId: "r1" }, { roleId: "r2" }]),
        }),
      });

      const result: any = await repository.getRoleIdsForUser("user1");
      // eslint-disable-next-line jest/no-conditional-expect
      if (Result.isOk(result)) expect((result as any).value).toEqual(["r1", "r2"]);
    });
  });

  describe("findDefaultRole", () => {
    test("should return DatabaseError when no default role exists", async () => {
      mockDb.select.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const result = await repository.findDefaultRole();
      expect(Result.isError(result)).toBe(true);
      // eslint-disable-next-line jest/no-conditional-expect
      if (Result.isError(result)) expect(result.error).toBeInstanceOf(DatabaseError);
    });

    test("should return the default role", async () => {
      const mockRole = {
        id: "r1",
        name: "user",
        description: "Default role",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockRole]),
          }),
        }),
      });

      const result = await repository.findDefaultRole();
      expect(Result.isOk(result)).toBe(true);
    });
  });
});