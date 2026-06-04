/**
 * Unit tests for PermissionResolver service.
 * Mocks userRepository to test permission resolution logic.
 */

import { describe, it, expect, vi, beforeEach } from "bun:test";
import { PermissionResolver } from "~/services/roles/permission-resolver.service";

// Mock userRepository (vi.mock is hoisted by Bun)
const mockGetUserPermissions = vi.fn();
vi.mock("~/repositories/users", () => ({
  userRepository: {
    getUserPermissions: mockGetUserPermissions,
  },
}));

describe("PermissionResolver", () => {
  let resolver: PermissionResolver;

  beforeEach(() => {
    vi.clearAllMocks();
    resolver = new PermissionResolver(100);
  });

  describe("getEffectivePermissions", () => {
    it("should return empty array when DB has no permissions and no fallback", async () => {
      mockGetUserPermissions.mockResolvedValue([]);

      const result = await resolver.getEffectivePermissions("user1");
      expect(result).toEqual([]);
    });

    it("should return DB permissions when available", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read", "users:write"]);

      const result = await resolver.getEffectivePermissions("user1");
      expect(result).toContain("dashboard:read");
      expect(result).toContain("users:write");
    });

    it("should deduplicate permissions", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read", "dashboard:read", "users:write"]);

      const result = await resolver.getEffectivePermissions("user1");
      expect(result).toHaveLength(2);
    });

    it("should fall back to hardcoded permissions when DB returns empty", async () => {
      mockGetUserPermissions.mockResolvedValue([]);

      const result = await resolver.getEffectivePermissions("user1", "admin");
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain("dashboard:read");
    });
  });

  describe("hasPermission", () => {
    it("should return true when user has the permission", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read"]);

      const result = await resolver.hasPermission("user1", "dashboard:read");
      expect(result).toBe(true);
    });

    it("should return false when user does not have the permission", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read"]);

      const result = await resolver.hasPermission("user1", "users:write");
      expect(result).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true when user has at least one permission", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read"]);

      const result = await resolver.hasAnyPermission("user1", ["dashboard:read", "users:write"]);
      expect(result).toBe(true);
    });

    it("should return false when user has none of the permissions", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read"]);

      const result = await resolver.hasAnyPermission("user1", ["users:write", "settings:read"]);
      expect(result).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true when user has all permissions", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read", "users:write"]);

      const result = await resolver.hasAllPermissions("user1", ["dashboard:read", "users:write"]);
      expect(result).toBe(true);
    });

    it("should return false when user misses any permission", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read"]);

      const result = await resolver.hasAllPermissions("user1", ["dashboard:read", "users:write"]);
      expect(result).toBe(false);
    });
  });

  describe("caching", () => {
    it("should cache results and avoid repeated DB calls", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read"]);

      await resolver.getEffectivePermissions("user1");
      await resolver.getEffectivePermissions("user1");

      expect(mockGetUserPermissions).toHaveBeenCalledTimes(1);
    });

    it("should invalidate cache for a specific user", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read"]);

      await resolver.getEffectivePermissions("user1");
      resolver.invalidateUser("user1");
      await resolver.getEffectivePermissions("user1");

      expect(mockGetUserPermissions).toHaveBeenCalledTimes(2);
    });

    it("should invalidate all cache", async () => {
      mockGetUserPermissions.mockResolvedValue(["dashboard:read"]);

      await resolver.getEffectivePermissions("user1");
      resolver.invalidateAll();
      await resolver.getEffectivePermissions("user1");

      expect(mockGetUserPermissions).toHaveBeenCalledTimes(2);
    });
  });
});