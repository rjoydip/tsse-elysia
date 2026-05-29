/**
 * Unit tests for RBAC permissions module
 */

import { describe, it, expect } from "bun:test";
import {
  userRoleSchema,
  permissionSchema,
  roleHierarchy,
  getPermissions,
  hasPermission,
  meetsRoleRequirement,
  getDashboardView,
  canAccessDashboardView,
  isAdminRole,
  isManagerRole,
  ALL_ROLES,
  ADMIN_ROLES,
  MANAGER_ROLES,
} from "~/lib/auth/permissions";

describe("Permission Schemas", () => {
  describe("userRoleSchema", () => {
    it("should accept valid user role", () => {
      expect(userRoleSchema.safeParse("admin").success).toBe(true);
      expect(userRoleSchema.safeParse("superadmin").success).toBe(true);
      expect(userRoleSchema.safeParse("manager").success).toBe(true);
      expect(userRoleSchema.safeParse("cashier").success).toBe(true);
      expect(userRoleSchema.safeParse("user").success).toBe(true);
    });

    it("should reject invalid role", () => {
      expect(userRoleSchema.safeParse("invalid").success).toBe(false);
      expect(userRoleSchema.safeParse("").success).toBe(false);
      expect(userRoleSchema.safeParse("ADMIN").success).toBe(false);
    });
  });

  describe("permissionSchema", () => {
    it("should accept valid permissions", () => {
      expect(permissionSchema.safeParse("dashboard:read").success).toBe(true);
      expect(permissionSchema.safeParse("dashboard:write").success).toBe(true);
      expect(permissionSchema.safeParse("users:delete").success).toBe(true);
    });

    it("should reject invalid permissions", () => {
      expect(permissionSchema.safeParse("invalid:permission").success).toBe(false);
      expect(permissionSchema.safeParse("admin").success).toBe(false);
    });
  });
});

describe("Role Hierarchy", () => {
  it("should have correct hierarchy values", () => {
    expect(roleHierarchy.user).toBe(0);
    expect(roleHierarchy.cashier).toBe(1);
    expect(roleHierarchy.manager).toBe(2);
    expect(roleHierarchy.admin).toBe(3);
    expect(roleHierarchy.superadmin).toBe(4);
  });

  it("should have higher roles with higher values", () => {
    expect(roleHierarchy.superadmin).toBeGreaterThan(roleHierarchy.admin);
    expect(roleHierarchy.admin).toBeGreaterThan(roleHierarchy.manager);
    expect(roleHierarchy.manager).toBeGreaterThan(roleHierarchy.cashier);
    expect(roleHierarchy.cashier).toBeGreaterThan(roleHierarchy.user);
  });
});

describe("getPermissions", () => {
  it("should return all permissions for superadmin", () => {
    const perms = getPermissions("superadmin");
    expect(perms).toContain("dashboard:read");
    expect(perms).toContain("dashboard:write");
    expect(perms).toContain("dashboard:analytics");
    expect(perms).toContain("users:read");
    expect(perms).toContain("users:write");
    expect(perms).toContain("users:delete");
    expect(perms).toContain("settings:write");
    expect(perms).toContain("reports:write");
  });

  it("should return limited permissions for user role", () => {
    const perms = getPermissions("user");
    expect(perms).toContain("dashboard:read");
    expect(perms).toContain("tasks:read");
    expect(perms).toContain("chats:read");
    expect(perms).not.toContain("users:write");
    expect(perms).not.toContain("users:delete");
    expect(perms).not.toContain("settings:write");
  });

  it("should return correct permissions for cashier", () => {
    const perms = getPermissions("cashier");
    expect(perms).toContain("dashboard:read");
    expect(perms).toContain("tasks:read");
    expect(perms).toContain("tasks:write");
    expect(perms).not.toContain("users:read");
    expect(perms).not.toContain("settings:write");
  });

  it("should return correct permissions for manager", () => {
    const perms = getPermissions("manager");
    expect(perms).toContain("dashboard:read");
    expect(perms).toContain("dashboard:analytics");
    expect(perms).toContain("users:read");
    expect(perms).not.toContain("users:delete");
    expect(perms).not.toContain("settings:write");
  });

  it("should return correct permissions for admin", () => {
    const perms = getPermissions("admin");
    expect(perms).toContain("dashboard:read");
    expect(perms).toContain("dashboard:analytics");
    expect(perms).toContain("users:read");
    expect(perms).toContain("users:write");
    expect(perms).not.toContain("users:delete");
  });

  it("should inherit permissions from lower roles", () => {
    const userPerms = getPermissions("user");
    const cashierPerms = getPermissions("cashier");
    const managerPerms = getPermissions("manager");
    const adminPerms = getPermissions("admin");
    const superadminPerms = getPermissions("superadmin");

    // Superadmin should have all permissions from all roles
    expect(superadminPerms.length).toBeGreaterThan(adminPerms.length);
    expect(adminPerms.length).toBeGreaterThan(managerPerms.length);
    expect(managerPerms.length).toBeGreaterThan(cashierPerms.length);
    expect(cashierPerms.length).toBeGreaterThan(userPerms.length);
  });
});

describe("hasPermission", () => {
  it("should return true when user has permission", () => {
    expect(hasPermission("admin", "dashboard:read")).toBe(true);
    expect(hasPermission("manager", "dashboard:analytics")).toBe(true);
    expect(hasPermission("cashier", "tasks:write")).toBe(true);
  });

  it("should return false when user lacks permission", () => {
    expect(hasPermission("user", "users:write")).toBe(false);
    expect(hasPermission("cashier", "settings:write")).toBe(false);
    expect(hasPermission("manager", "users:delete")).toBe(false);
  });

  it("should handle admin and superadmin with all permissions", () => {
    expect(hasPermission("admin", "settings:write")).toBe(true);
    expect(hasPermission("admin", "reports:read")).toBe(true);
    expect(hasPermission("superadmin", "users:delete")).toBe(true);
    expect(hasPermission("superadmin", "reports:write")).toBe(true);
  });
});

describe("meetsRoleRequirement", () => {
  it("should return true when role meets requirement", () => {
    expect(meetsRoleRequirement("admin", "user")).toBe(true);
    expect(meetsRoleRequirement("admin", "cashier")).toBe(true);
    expect(meetsRoleRequirement("admin", "manager")).toBe(true);
    expect(meetsRoleRequirement("manager", "user")).toBe(true);
    expect(meetsRoleRequirement("manager", "cashier")).toBe(true);
    expect(meetsRoleRequirement("cashier", "user")).toBe(true);
  });

  it("should return false when role does not meet requirement", () => {
    expect(meetsRoleRequirement("user", "admin")).toBe(false);
    expect(meetsRoleRequirement("user", "manager")).toBe(false);
    expect(meetsRoleRequirement("cashier", "manager")).toBe(false);
    expect(meetsRoleRequirement("manager", "admin")).toBe(false);
  });

  it("should return true when role equals required role", () => {
    expect(meetsRoleRequirement("admin", "admin")).toBe(true);
    expect(meetsRoleRequirement("user", "user")).toBe(true);
    expect(meetsRoleRequirement("superadmin", "superadmin")).toBe(true);
  });
});

describe("getDashboardView", () => {
  it("should return full for superadmin", () => {
    expect(getDashboardView("superadmin")).toBe("full");
  });

  it("should return full for admin", () => {
    expect(getDashboardView("admin")).toBe("full");
  });

  it("should return team for manager", () => {
    expect(getDashboardView("manager")).toBe("team");
  });

  it("should return sales for cashier", () => {
    expect(getDashboardView("cashier")).toBe("sales");
  });

  it("should return basic for user", () => {
    expect(getDashboardView("user")).toBe("basic");
  });
});

describe("canAccessDashboardView", () => {
  it("should allow higher roles to access lower views", () => {
    expect(canAccessDashboardView("superadmin", "basic")).toBe(true);
    expect(canAccessDashboardView("superadmin", "sales")).toBe(true);
    expect(canAccessDashboardView("superadmin", "team")).toBe(true);
    expect(canAccessDashboardView("superadmin", "full")).toBe(true);

    expect(canAccessDashboardView("admin", "basic")).toBe(true);
    expect(canAccessDashboardView("admin", "sales")).toBe(true);
    expect(canAccessDashboardView("admin", "team")).toBe(true);

    expect(canAccessDashboardView("manager", "basic")).toBe(true);
    expect(canAccessDashboardView("manager", "sales")).toBe(true);

    expect(canAccessDashboardView("cashier", "basic")).toBe(true);
  });

  it("should not allow lower roles to access higher views", () => {
    expect(canAccessDashboardView("user", "full")).toBe(false);
    expect(canAccessDashboardView("user", "team")).toBe(false);
    expect(canAccessDashboardView("user", "sales")).toBe(false);

    expect(canAccessDashboardView("cashier", "full")).toBe(false);
    expect(canAccessDashboardView("cashier", "team")).toBe(false);

    expect(canAccessDashboardView("manager", "full")).toBe(false);
  });

  it("should allow same-level access", () => {
    expect(canAccessDashboardView("user", "basic")).toBe(true);
    expect(canAccessDashboardView("cashier", "sales")).toBe(true);
    expect(canAccessDashboardView("manager", "team")).toBe(true);
    expect(canAccessDashboardView("admin", "full")).toBe(true);
    expect(canAccessDashboardView("superadmin", "full")).toBe(true);
  });
});

describe("isAdminRole", () => {
  it("should return true for admin roles", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(true);
  });

  it("should return false for non-admin roles", () => {
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole("cashier")).toBe(false);
    expect(isAdminRole("manager")).toBe(false);
  });
});

describe("isManagerRole", () => {
  it("should return true for manager and above", () => {
    expect(isManagerRole("manager")).toBe(true);
    expect(isManagerRole("admin")).toBe(true);
    expect(isManagerRole("superadmin")).toBe(true);
  });

  it("should return false for non-manager roles", () => {
    expect(isManagerRole("user")).toBe(false);
    expect(isManagerRole("cashier")).toBe(false);
  });
});

describe("Role Arrays", () => {
  it("should have all roles defined", () => {
    expect(ALL_ROLES).toContain("user");
    expect(ALL_ROLES).toContain("cashier");
    expect(ALL_ROLES).toContain("manager");
    expect(ALL_ROLES).toContain("admin");
    expect(ALL_ROLES).toContain("superadmin");
    expect(ALL_ROLES.length).toBe(5);
  });

  it("should have correct admin roles", () => {
    expect(ADMIN_ROLES).toContain("admin");
    expect(ADMIN_ROLES).toContain("superadmin");
    expect(ADMIN_ROLES.length).toBe(2);
  });

  it("should have correct manager roles", () => {
    expect(MANAGER_ROLES).toContain("manager");
    expect(MANAGER_ROLES).toContain("admin");
    expect(MANAGER_ROLES).toContain("superadmin");
    expect(MANAGER_ROLES.length).toBe(3);
  });
});

describe("Permission inheritance verification", () => {
  it("superadmin should have all permissions from admin", () => {
    const adminPerms = getPermissions("admin");
    const superadminPerms = getPermissions("superadmin");
    for (const perm of adminPerms) {
      expect(superadminPerms).toContain(perm);
    }
  });

  it("admin should have all permissions from manager", () => {
    const managerPerms = getPermissions("manager");
    const adminPerms = getPermissions("admin");
    for (const perm of managerPerms) {
      expect(adminPerms).toContain(perm);
    }
  });

  it("manager should have all permissions from cashier", () => {
    const cashierPerms = getPermissions("cashier");
    const managerPerms = getPermissions("manager");
    for (const perm of cashierPerms) {
      expect(managerPerms).toContain(perm);
    }
  });

  it("cashier should have all permissions from user", () => {
    const userPerms = getPermissions("user");
    const cashierPerms = getPermissions("cashier");
    for (const perm of userPerms) {
      expect(cashierPerms).toContain(perm);
    }
  });
});