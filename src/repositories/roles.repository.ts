/**
 * Roles and Permissions repository.
 * Handles all ORM (Drizzle) operations for role and permission management.
 * All methods return Result types for type-safe error handling.
 */

import { eq, and } from "drizzle-orm";
import { db } from "~/config/db";
import { nanoid } from "nanoid";
import {
  permissions,
  roles,
  rolePermissions,
  type Permission,
  type Role,
} from "~/lib/db/schema/roles";
import { Result, DatabaseError, NotFoundError, ValidationError } from "~/lib/result";

/**
 * Helper function to wrap database operations in error handling.
 */
async function withDatabaseError<T>(
  operation: () => Promise<T>,
): Promise<Result<T, DatabaseError>> {
  try {
    return Result.ok(await operation());
  } catch (error) {
    return Result.err(
      new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
    );
  }
}

/**
 * Repository interface for role and permission database operations.
 */
export interface IRolesRepository {
  // Permission methods
  findAllPermissions(): Promise<Result<Permission[], DatabaseError>>;
  findPermissionById(id: string): Promise<Result<Permission, DatabaseError | NotFoundError>>;
  findPermissionByName(name: string): Promise<Result<Permission, DatabaseError | NotFoundError>>;
  createPermission(data: {
    name: string;
    description?: string;
  }): Promise<Result<Permission, DatabaseError | ValidationError>>;
  updatePermission(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Result<void, DatabaseError | NotFoundError | ValidationError>>;
  deletePermission(id: string): Promise<Result<void, DatabaseError | NotFoundError>>;

  // Role methods
  findAllRoles(): Promise<Result<Role[], DatabaseError>>;
  findRoleById(id: string): Promise<Result<Role, DatabaseError | NotFoundError>>;
  findRoleByName(name: string): Promise<Result<Role, DatabaseError | NotFoundError>>;
  createRole(data: {
    name: string;
    description?: string;
    isDefault?: boolean;
  }): Promise<Result<Role, DatabaseError | ValidationError>>;
  updateRole(
    id: string,
    data: { name?: string; description?: string; isDefault?: boolean },
  ): Promise<Result<void, DatabaseError | NotFoundError | ValidationError>>;
  deleteRole(id: string): Promise<Result<void, DatabaseError | NotFoundError>>;

  // Role-Permission association methods
  getPermissionsForRole(
    roleId: string,
  ): Promise<Result<Permission[], DatabaseError | NotFoundError>>;
  addPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<Result<void, DatabaseError | NotFoundError>>;
  removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Result<void, DatabaseError | NotFoundError>>;
  setPermissionsForRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Result<void, DatabaseError | NotFoundError>>;
}

/**
 * Roles repository implementation using Drizzle ORM.
 */
export class RolesRepository implements IRolesRepository {
  /**
   * Finds all permissions in the system.
   */
  async findAllPermissions(): Promise<Result<Permission[], DatabaseError>> {
    return withDatabaseError(async () => {
      const records = await db.select().from(permissions).orderBy(permissions.name);
      return records as Permission[];
    });
  }

  /**
   * Finds a permission by ID.
   */
  async findPermissionById(id: string): Promise<Result<Permission, DatabaseError | NotFoundError>> {
    return withDatabaseError(async () => {
      const records = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);
      if (records.length === 0) {
        throw new NotFoundError({ resource: "Permission", id });
      }
      return records[0] as Permission;
    });
  }

  /**
   * Finds a permission by name.
   */
  async findPermissionByName(
    name: string,
  ): Promise<Result<Permission, DatabaseError | NotFoundError>> {
    return withDatabaseError(async () => {
      const records = await db.select().from(permissions).where(eq(permissions.name, name)).limit(1);
      if (records.length === 0) {
        throw new NotFoundError({ resource: "Permission", id: name });
      }
      return records[0] as Permission;
    });
  }

  /**
   * Creates a new permission.
   */
  async createPermission(data: {
    name: string;
    description?: string;
  }): Promise<Result<Permission, DatabaseError | ValidationError>> {
    const normalizedName = data.name.toLowerCase().trim();

    const existing = await this.findPermissionByName(normalizedName);
    if (Result.isOk(existing)) {
      return Result.err(
        new ValidationError({ field: "name", message: "Permission with this name already exists" }),
      );
    }

    const now = new Date();
    try {
      await db.insert(permissions).values({
        id: nanoid(),
        name: normalizedName,
        description: data.description ?? null,
        createdAt: now,
        updatedAt: now,
      });

      const created = await this.findPermissionById(nanoid());
      if (Result.isError(created)) {
        const byName = await this.findPermissionByName(normalizedName);
        return byName as Result<Permission, DatabaseError | ValidationError>;
      }
      return created as Result<Permission, DatabaseError | ValidationError>;
    } catch (error) {
      return Result.err(
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
      );
    }
  }

  /**
   * Updates an existing permission.
   */
  async updatePermission(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Result<void, DatabaseError | NotFoundError | ValidationError>> {
    const existing = await this.findPermissionById(id);
    if (Result.isError(existing)) {
      return existing;
    }

    const normalizedName = data.name?.toLowerCase().trim();
    if (normalizedName && normalizedName !== existing.value.name) {
      const duplicate = await this.findPermissionByName(normalizedName);
      if (Result.isOk(duplicate)) {
        return Result.err(
          new ValidationError({
            field: "name",
            message: "Permission with this name already exists",
          }),
        );
      }
    }

    try {
      await db
        .update(permissions)
        .set({
          name: normalizedName,
          description: data.description !== undefined ? data.description : null,
          updatedAt: new Date(),
        })
        .where(eq(permissions.id, id));
      return Result.ok();
    } catch (error) {
      return Result.err(
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
      );
    }
  }

  /**
   * Deletes a permission.
   */
  async deletePermission(id: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    const existing = await this.findPermissionById(id);
    if (Result.isError(existing)) {
      return existing;
    }

    return withDatabaseError(async () => {
      await db.delete(permissions).where(eq(permissions.id, id));
    });
  }

  /**
   * Finds all roles in the system.
   */
  async findAllRoles(): Promise<Result<Role[], DatabaseError>> {
    return withDatabaseError(async () => {
      const records = await db.select().from(roles).orderBy(roles.name);
      return records as Role[];
    });
  }

  /**
   * Finds a role by ID.
   */
  async findRoleById(id: string): Promise<Result<Role, DatabaseError | NotFoundError>> {
    return withDatabaseError(async () => {
      const records = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
      if (records.length === 0) {
        throw new NotFoundError({ resource: "Role", id });
      }
      return records[0] as Role;
    });
  }

  /**
   * Finds a role by name.
   */
  async findRoleByName(name: string): Promise<Result<Role, DatabaseError | NotFoundError>> {
    const normalizedName = name.toLowerCase().trim();
    return withDatabaseError(async () => {
      const records = await db.select().from(roles).where(eq(roles.name, normalizedName)).limit(1);
      if (records.length === 0) {
        throw new NotFoundError({ resource: "Role", id: normalizedName });
      }
      return records[0] as Role;
    });
  }

  /**
   * Creates a new role.
   */
  async createRole(data: {
    name: string;
    description?: string;
    isDefault?: boolean;
  }): Promise<Result<Role, DatabaseError | ValidationError>> {
    const normalizedName = data.name.toLowerCase().trim();

    const existing = await this.findRoleByName(normalizedName);
    if (Result.isOk(existing)) {
      return Result.err(
        new ValidationError({ field: "name", message: "Role with this name already exists" }),
      );
    }

    if (data.isDefault) {
      await db.update(roles).set({ isDefault: false });
    }

    const now = new Date();
    const roleId = nanoid();
    try {
      await db.insert(roles).values({
        id: roleId,
        name: normalizedName,
        description: data.description ?? null,
        isDefault: data.isDefault ?? false,
        createdAt: now,
        updatedAt: now,
      });

      const created = await this.findRoleById(roleId);
      if (Result.isError(created)) {
        const byName = await this.findRoleByName(normalizedName);
        return byName as Result<Role, DatabaseError | ValidationError>;
      }
      return created as Result<Role, DatabaseError | ValidationError>;
    } catch (error) {
      return Result.err(
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
      );
    }
  }

  /**
   * Updates an existing role.
   */
  async updateRole(
    id: string,
    data: { name?: string; description?: string; isDefault?: boolean },
  ): Promise<Result<void, DatabaseError | NotFoundError | ValidationError>> {
    const existing = await this.findRoleById(id);
    if (Result.isError(existing)) {
      return existing;
    }

    const normalizedName = data.name?.toLowerCase().trim();
    if (normalizedName && normalizedName !== existing.value.name) {
      const duplicate = await this.findRoleByName(normalizedName);
      if (Result.isOk(duplicate)) {
        return Result.err(
          new ValidationError({ field: "name", message: "Role with this name already exists" }),
        );
      }
    }

    if (data.isDefault && !existing.value.isDefault) {
      await db.update(roles).set({ isDefault: false });
    }

    try {
      await db
        .update(roles)
        .set({
          name: normalizedName,
          description: data.description !== undefined ? data.description : null,
          isDefault: data.isDefault,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, id));
      return Result.ok();
    } catch (error) {
      return Result.err(
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
      );
    }
  }

  /**
   * Deletes a role.
   */
  async deleteRole(id: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    const existing = await this.findRoleById(id);
    if (Result.isError(existing)) {
      return existing;
    }

    return withDatabaseError(async () => {
      await db.delete(roles).where(eq(roles.id, id));
    });
  }

  /**
   * Gets all permissions for a specific role.
   */
  async getPermissionsForRole(
    roleId: string,
  ): Promise<Result<Permission[], DatabaseError | NotFoundError>> {
    const roleExists = await this.findRoleById(roleId);
    if (Result.isError(roleExists)) {
      return roleExists;
    }

    return withDatabaseError(async () => {
      const records = await db
        .select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));
      return records.map((r) => r.permission) as Permission[];
    });
  }

  /**
   * Adds a permission to a role.
   */
  async addPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<Result<void, DatabaseError | NotFoundError>> {
    const roleExists = await this.findRoleById(roleId);
    if (Result.isError(roleExists)) {
      return roleExists;
    }

    const permExists = await this.findPermissionById(permissionId);
    if (Result.isError(permExists)) {
      return permExists;
    }

    return withDatabaseError(async () => {
      const existing = await db
        .select()
        .from(rolePermissions)
        .where(
          and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(rolePermissions).values({ roleId, permissionId });
      }
    });
  }

  /**
   * Removes a permission from a role.
   */
  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Result<void, DatabaseError | NotFoundError>> {
    const roleExists = await this.findRoleById(roleId);
    if (Result.isError(roleExists)) {
      return roleExists;
    }

    return withDatabaseError(async () => {
      await db
        .delete(rolePermissions)
        .where(
          and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)),
        );
    });
  }

  /**
   * Sets all permissions for a role (replaces existing).
   */
  async setPermissionsForRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Result<void, DatabaseError | NotFoundError>> {
    const roleExists = await this.findRoleById(roleId);
    if (Result.isError(roleExists)) {
      return roleExists;
    }

    return withDatabaseError(async () => {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      if (permissionIds.length > 0) {
        const values = permissionIds.map((permissionId) => ({ roleId, permissionId }));
        await db.insert(rolePermissions).values(values);
      }
    });
  }
}

/**
 * Singleton instance of the roles repository.
 */
export const rolesRepository = new RolesRepository();