/**
 * Roles and Permissions service.
 * Encapsulates role/permission business logic, uses repository for DB operations.
 */

import { rolesRepository, type IRolesRepository } from "~/repositories/roles.repository";
import { Result } from "~/lib/result";

/**
 * Permission response type for API.
 */
export interface PermissionResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role response type for API.
 */
export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create permission input.
 */
export interface CreatePermissionInput {
  name: string;
  description?: string;
}

/**
 * Update permission input.
 */
export interface UpdatePermissionInput {
  name?: string;
  description?: string;
}

/**
 * Create role input.
 */
export interface CreateRoleInput {
  name: string;
  description?: string;
  isDefault?: boolean;
  permissionIds?: string;
}

/**
 * Update role input.
 */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  isDefault?: boolean;
  permissionIds?: string;
}

/**
 * Roles service interface.
 */
export interface IRolesService {
  // Permission methods
  getAllPermissions(): Promise<PermissionResponse[]>;
  getPermission(id: string): Promise<PermissionResponse | null>;
  createPermission(input: CreatePermissionInput): Promise<PermissionResponse>;
  updatePermission(id: string, input: UpdatePermissionInput): Promise<PermissionResponse>;
  deletePermission(id: string): Promise<boolean>;

  // Role methods
  getAllRoles(): Promise<RoleResponse[]>;
  getRole(id: string): Promise<RoleResponse | null>;
  createRole(input: CreateRoleInput): Promise<RoleResponse>;
  updateRole(id: string, input: UpdateRoleInput): Promise<RoleResponse>;
  deleteRole(id: string): Promise<boolean>;

  // Seed default permissions
  seedDefaultPermissions(): Promise<void>;
}

/**
 * Roles service implementation.
 */
export class RolesService implements IRolesService {
  private repository: IRolesRepository;

  constructor(repository: IRolesRepository = rolesRepository) {
    this.repository = repository;
  }

  /**
   * Converts database permission to response format.
   */
  private toPermissionResponse(permission: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PermissionResponse {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }

  /**
   * Converts database role to response format with permissions.
   */
  private async toRoleResponse(role: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<RoleResponse | null> {
    const permsResult = await this.repository.getPermissionsForRole(role.id);
    const permissions = Result.isOk(permsResult) ? permsResult.value.map((p) => p.name) : [];

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      permissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /**
   * Gets all permissions.
   */
  async getAllPermissions(): Promise<PermissionResponse[]> {
    const result = await this.repository.findAllPermissions();
    if (Result.isError(result)) {
      return [];
    }
    return result.value.map((p) => this.toPermissionResponse(p));
  }

  /**
   * Gets a permission by ID.
   */
  async getPermission(id: string): Promise<PermissionResponse | null> {
    const result = await this.repository.findPermissionById(id);
    if (Result.isError(result)) {
      return null;
    }
    return this.toPermissionResponse(result.value);
  }

  /**
   * Creates a new permission.
   */
  async createPermission(input: CreatePermissionInput): Promise<PermissionResponse> {
    const result = await this.repository.createPermission({
      name: input.name,
      description: input.description,
    });

    if (Result.isError(result)) {
      throw new Error(result.error.message);
    }

    return this.toPermissionResponse(result.value);
  }

  /**
   * Updates a permission.
   */
  async updatePermission(id: string, input: UpdatePermissionInput): Promise<PermissionResponse> {
    const result = await this.repository.updatePermission(id, {
      name: input.name,
      description: input.description,
    });

    if (Result.isError(result)) {
      throw new Error(result.error.message);
    }

    const updated = await this.repository.findPermissionById(id);
    if (Result.isError(updated)) {
      throw new Error("Permission not found");
    }

    return this.toPermissionResponse(updated.value);
  }

  /**
   * Deletes a permission.
   */
  async deletePermission(id: string): Promise<boolean> {
    const result = await this.repository.deletePermission(id);
    return Result.isOk(result);
  }

  /**
   * Gets all roles.
   */
  async getAllRoles(): Promise<RoleResponse[]> {
    const result = await this.repository.findAllRoles();
    if (Result.isError(result)) {
      return [];
    }

    const roles: RoleResponse[] = [];
    for (const role of result.value) {
      const roleResponse = await this.toRoleResponse(role);
      if (roleResponse) {
        roles.push(roleResponse);
      }
    }
    return roles;
  }

  /**
   * Gets a role by ID.
   */
  async getRole(id: string): Promise<RoleResponse | null> {
    const result = await this.repository.findRoleById(id);
    if (Result.isError(result)) {
      return null;
    }
    return this.toRoleResponse(result.value);
  }

  /**
   * Creates a new role.
   */
  async createRole(input: CreateRoleInput): Promise<RoleResponse> {
    const result = await this.repository.createRole({
      name: input.name,
      description: input.description,
      isDefault: input.isDefault,
    });

    if (Result.isError(result)) {
      throw new Error(result.error.message);
    }

    const role = result.value;

    if (input.permissionIds && input.permissionIds.length > 0) {
      const permIds = input.permissionIds.split(",").map((p) => p.trim());
      await this.repository.setPermissionsForRole(role.id, permIds);
    }

    const updatedRole = await this.repository.findRoleById(role.id);
    if (Result.isError(updatedRole)) {
      throw new Error("Role not found");
    }

    const roleResponse = await this.toRoleResponse(updatedRole.value);
    if (!roleResponse) {
      throw new Error("Failed to create role response");
    }

    return roleResponse;
  }

  /**
   * Updates a role.
   */
  async updateRole(id: string, input: UpdateRoleInput): Promise<RoleResponse> {
    const result = await this.repository.updateRole(id, {
      name: input.name,
      description: input.description,
      isDefault: input.isDefault,
    });

    if (Result.isError(result)) {
      throw new Error(result.error.message);
    }

    if (input.permissionIds !== undefined) {
      const permIds = input.permissionIds
        ? input.permissionIds.split(",").map((p: string) => p.trim())
        : [];
      await this.repository.setPermissionsForRole(id, permIds);
    }

    const updatedRole = await this.repository.findRoleById(id);
    if (Result.isError(updatedRole)) {
      throw new Error("Role not found");
    }

    const roleResponse = await this.toRoleResponse(updatedRole.value);
    if (!roleResponse) {
      throw new Error("Failed to update role response");
    }

    return roleResponse;
  }

  /**
   * Deletes a role.
   */
  async deleteRole(id: string): Promise<boolean> {
    const result = await this.repository.deleteRole(id);
    return Result.isOk(result);
  }

  /**
   * Seeds default permissions from the system-defined permission schema.
   * This creates database records for all permissions defined in the code.
   */
  async seedDefaultPermissions(): Promise<void> {
    const existing = await this.repository.findAllPermissions();
    if (Result.isOk(existing) && existing.value.length > 0) {
      return; // Already seeded
    }

    const systemPermissions: string[] = [
      "dashboard:read",
      "dashboard:write",
      "dashboard:analytics",
      "users:read",
      "users:write",
      "users:delete",
      "settings:read",
      "settings:write",
      "tasks:read",
      "tasks:write",
      "tasks:delete",
      "apps:read",
      "apps:write",
      "chats:read",
      "chats:write",
      "reports:read",
      "reports:write",
    ];

    for (const permName of systemPermissions) {
      const existingPerm = await this.repository.findPermissionByName(permName);
      if (Result.isError(existingPerm)) {
        await this.repository.createPermission({
          name: permName,
          description: `System permission: ${permName}`,
        });
      }
    }
  }
}

/**
 * Singleton instance of the roles service.
 */
export const rolesService = new RolesService();