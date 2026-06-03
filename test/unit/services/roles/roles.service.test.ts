/**
 * Unit tests for RolesService.
 * Mocks the repository layer to test business logic in isolation.
 */

import { describe, it, expect, vi, beforeEach } from "bun:test";
import { Result } from "~/lib/result";
import { RolesService } from "~/services/dashboard/roles";

describe("RolesService", () => {
  let service: RolesService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findAllPermissions: vi.fn(),
      findPermissionById: vi.fn(),
      findPermissionByName: vi.fn(),
      createPermission: vi.fn(),
      updatePermission: vi.fn(),
      deletePermission: vi.fn(),
      findAllRoles: vi.fn(),
      findRoleById: vi.fn(),
      findRoleByName: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      getPermissionsForRole: vi.fn(),
      addPermissionToRole: vi.fn(),
      removePermissionFromRole: vi.fn(),
      setPermissionsForRole: vi.fn(),
      assignRoleToUser: vi.fn(),
      removeRoleFromUser: vi.fn(),
      getUserRoles: vi.fn(),
      getRoleIdsForUser: vi.fn(),
      findDefaultRole: vi.fn(),
    };

    service = new RolesService(mockRepository);
  });

  describe("getAllPermissions", () => {
    it("should return empty array when repository returns error", async () => {
      mockRepository.findAllPermissions.mockResolvedValue(Result.err(new Error("DB error")));

      const result = await service.getAllPermissions();
      expect(result).toEqual([]);
    });

    it("should return permissions when repository succeeds", async () => {
      const mockPermissions = [
        {
          id: "p1",
          name: "dashboard:read",
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findAllPermissions.mockResolvedValue(Result.ok(mockPermissions));

      const result = await service.getAllPermissions();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("dashboard:read");
    });
  });

  describe("createPermission", () => {
    it("should throw when repository returns error", async () => {
      mockRepository.createPermission.mockResolvedValue(
        Result.err(new Error("Permission already exists")),
      );

      await expect(service.createPermission({ name: "test:perm" })).rejects.toThrow(
        "Permission already exists",
      );
    });

    it("should create and return permission on success", async () => {
      const mockPermission = {
        id: "p1",
        name: "test:perm",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.createPermission.mockResolvedValue(Result.ok(mockPermission));

      const result = await service.createPermission({ name: "test:perm" });
      expect(result.name).toBe("test:perm");
    });
  });

  describe("deletePermission", () => {
    it("should return true on success", async () => {
      // findPermissionById first (called inside deletePermission)
      mockRepository.findPermissionById.mockResolvedValue(
        Result.ok({
          id: "p1",
          name: "test",
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
      mockRepository.deletePermission.mockResolvedValue(Result.ok());

      const result = await service.deletePermission("p1");
      expect(result).toBe(true);
    });

    it("should return false on failure", async () => {
      mockRepository.findPermissionById.mockResolvedValue(
        Result.ok({
          id: "p1",
          name: "test",
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
      mockRepository.deletePermission.mockResolvedValue(Result.err(new Error("Not found")));

      const result = await service.deletePermission("p1");
      expect(result).toBe(false);
    });
  });

  describe("getAllRoles", () => {
    it("should return empty array when repository returns error", async () => {
      mockRepository.findAllRoles.mockResolvedValue(Result.err(new Error("DB error")));

      const result = await service.getAllRoles();
      expect(result).toEqual([]);
    });

    it("should return roles with permissions when repository succeeds", async () => {
      const mockRole = {
        id: "r1",
        name: "admin",
        description: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findAllRoles.mockResolvedValue(Result.ok([mockRole]));
      mockRepository.getPermissionsForRole.mockResolvedValue(
        Result.ok([
          {
            id: "p1",
            name: "dashboard:read",
            description: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      );

      const result = await service.getAllRoles();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("admin");
    });
  });

  describe("assignRoleToUser", () => {
    it("should throw when repository returns error", async () => {
      mockRepository.assignRoleToUser.mockResolvedValue(Result.err(new Error("Role not found")));

      await expect(service.assignRoleToUser("user1", "role1")).rejects.toThrow("Role not found");
    });

    it("should succeed when repository succeeds", async () => {
      mockRepository.assignRoleToUser.mockResolvedValue(Result.ok());

      await expect(service.assignRoleToUser("user1", "role1")).resolves.toBeUndefined();
    });
  });

  describe("removeRoleFromUser", () => {
    it("should return true on success", async () => {
      mockRepository.removeRoleFromUser.mockResolvedValue(Result.ok());

      const result = await service.removeRoleFromUser("user1", "role1");
      expect(result).toBe(true);
    });

    it("should return false on failure", async () => {
      mockRepository.removeRoleFromUser.mockResolvedValue(Result.err(new Error("Not found")));

      const result = await service.removeRoleFromUser("user1", "role1");
      expect(result).toBe(false);
    });
  });

  describe("getUserRoleIds", () => {
    it("should return empty array on repository error", async () => {
      mockRepository.getRoleIdsForUser.mockResolvedValue(Result.err(new Error("DB error")));

      const result = await service.getUserRoleIds("user1");
      expect(result).toEqual([]);
    });

    it("should return role IDs on success", async () => {
      mockRepository.getRoleIdsForUser.mockResolvedValue(Result.ok(["r1", "r2"]));

      const result = await service.getUserRoleIds("user1");
      expect(result).toEqual(["r1", "r2"]);
    });
  });
});