/**
 * Roles and Permissions repository.
 * Handles all ORM (Drizzle) operations for role and permission management.
 * All methods return Result types for type-safe error handling.
 */

import { eq, and } from "drizzle-orm";
import { db as defaultDb, type DbType } from "~/config/db";
import { nanoid } from "nanoid";
import {
  permissions,
  roles,
  rolePermissions,
  userRoles,
  type Permission,
  type Role,
  type UserRole,
} from "~/lib/db";
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
  findAllPermissions(limit?: number, offset?: number): Promise<Result<Permission[], DatabaseError>>;
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
  findAllRoles(limit?: number, offset?: number): Promise<Result<Role[], DatabaseError>>;
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

  // User-Role association methods
  assignRoleToUser(
    userId: string,
    roleId: string,
  ): Promise<Result<void, DatabaseError | NotFoundError | ValidationError>>;
  removeRoleFromUser(
    userId: string,
    roleId: string,
  ): Promise<Result<void, DatabaseError | NotFoundError>>;
  getUserRoles(userId: string): Promise<Result<UserRole[], DatabaseError>>;
  getRoleIdsForUser(userId: string): Promise<Result<string[], DatabaseError>>;
  findDefaultRole(): Promise<Result<Role, DatabaseError | NotFoundError>>;
}

/**
 * Roles repository implementation using Drizzle ORM.
 */
export class RolesRepository implements IRolesRepository {
  private db: DbType | undefined;

  /**
   * Creates a new RolesRepository instance.
   * @param db - Optional database instance for dependency injection (testing).
   */
  constructor(db?: DbType) {
    this.db = db;
  }

  /**
   * Returns the database instance, preferring the constructor-injected instance
   * over the module-level default.
   */
  private getDb(): DbType {
    return this.db ?? defaultDb;
  }

  /**
   * Finds all permissions in the system.
   */
  async findAllPermissions(
    limit: number = 100,
    offset: number = 0,
  ): Promise<Result<Permission[], DatabaseError>> {
    return withDatabaseError(async () => {
      const records = await this.getDb()
        .select()
        .from(permissions)
        .orderBy(permissions.name)
        .limit(limit)
        .offset(offset);
      return records as Permission[];
    });
  }

  /**
   * Finds a permission by ID.
   */
  async findPermissionById(id: string): Promise<Result<Permission, DatabaseError | NotFoundError>> {
    return withDatabaseError(async () => {
      const records = await this.getDb()
        .select()
        .from(permissions)
        .where(eq(permissions.id, id))
        .limit(1);
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
      const records = await this.getDb()
        .select()
        .from(permissions)
        .where(eq(permissions.name, name))
        .limit(1);
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
    const permId = nanoid();
    try {
      await this.getDb()
        .insert(permissions)
        .values({
          id: permId,
          name: normalizedName,
          description: data.description ?? null,
          createdAt: now,
          updatedAt: now,
        });

      const created = await this.findPermissionById(permId);
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
      return Result.err(existing.error);
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
      await this.getDb()
        .update(permissions)
        .set({
          name: data.name !== undefined ? normalizedName : existing.value.name,
          description:
            data.description !== undefined ? data.description : existing.value.description,
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
   * Deletes a permission and cleans up junction table records.
   */
  async deletePermission(id: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    const existing = await this.findPermissionById(id);
    if (Result.isError(existing)) {
      return Result.err(existing.error);
    }

    return withDatabaseError(async () => {
      await this.getDb().transaction(async (tx: DbType) => {
        await tx.delete(rolePermissions).where(eq(rolePermissions.permissionId, id));
        await tx.delete(permissions).where(eq(permissions.id, id));
      });
    });
  }

  /**
   * Finds all roles in the system.
   */
  async findAllRoles(
    limit: number = 100,
    offset: number = 0,
  ): Promise<Result<Role[], DatabaseError>> {
    return withDatabaseError(async () => {
      const records = await this.getDb()
        .select()
        .from(roles)
        .orderBy(roles.name)
        .limit(limit)
        .offset(offset);
      return records as Role[];
    });
  }

  /**
   * Finds a role by ID.
   */
  async findRoleById(id: string): Promise<Result<Role, DatabaseError | NotFoundError>> {
    return withDatabaseError(async () => {
      const records = await this.getDb().select().from(roles).where(eq(roles.id, id)).limit(1);
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
      const records = await this.getDb()
        .select()
        .from(roles)
        .where(eq(roles.name, normalizedName))
        .limit(1);
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

    const now = new Date();
    const roleId = nanoid();
    try {
      await this.getDb().transaction(async (tx: DbType) => {
        if (data.isDefault) {
          await tx.update(roles).set({ isDefault: false }).where(eq(roles.isDefault, true));
        }
        await tx.insert(roles).values({
          id: roleId,
          name: normalizedName,
          description: data.description ?? null,
          isDefault: data.isDefault ?? false,
          createdAt: now,
          updatedAt: now,
        });
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
      return Result.err(existing.error);
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

    try {
      await this.getDb().transaction(async (tx: DbType) => {
        if (data.isDefault) {
          await tx.update(roles).set({ isDefault: false }).where(eq(roles.isDefault, true));
        }

        await tx
          .update(roles)
          .set({
            name: data.name !== undefined ? normalizedName : existing.value.name,
            description:
              data.description !== undefined ? data.description : existing.value.description,
            isDefault: data.isDefault !== undefined ? data.isDefault : existing.value.isDefault,
            updatedAt: new Date(),
          })
          .where(eq(roles.id, id));
      });
      return Result.ok();
    } catch (error) {
      return Result.err(
        new DatabaseError({ message: error instanceof Error ? error.message : String(error) }),
      );
    }
  }

  /**
   * Deletes a role and cleans up junction table records.
   */
  async deleteRole(id: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    const existing = await this.findRoleById(id);
    if (Result.isError(existing)) {
      return Result.err(existing.error);
    }

    return withDatabaseError(async () => {
      await this.getDb().transaction(async (tx: DbType) => {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
        await tx.delete(userRoles).where(eq(userRoles.roleId, id));
        await tx.delete(roles).where(eq(roles.id, id));
      });
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
      return Result.err(roleExists.error);
    }

    return withDatabaseError(async () => {
      const records = await this.getDb()
        .select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));
      return records.map((r: { permission: Permission }) => r.permission) as Permission[];
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
      return Result.err(roleExists.error);
    }

    const permExists = await this.findPermissionById(permissionId);
    if (Result.isError(permExists)) {
      return Result.err(permExists.error);
    }

    return withDatabaseError(async () => {
      const existing = await this.getDb()
        .select()
        .from(rolePermissions)
        .where(
          and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)),
        )
        .limit(1);

      if (existing.length === 0) {
        await this.getDb().insert(rolePermissions).values({ roleId, permissionId });
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
      return Result.err(roleExists.error);
    }

    return withDatabaseError(async () => {
      await this.getDb()
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
      return Result.err(roleExists.error);
    }

    return withDatabaseError(async () => {
      await this.getDb().delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      if (permissionIds.length > 0) {
        const values = permissionIds.map((permissionId) => ({ roleId, permissionId }));
        await this.getDb().insert(rolePermissions).values(values);
      }
    });
  }

  // ---- User-Role association methods ----

  /**
   * Assigns a role to a user.
   * Creates a record in the user_role junction table.
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
  ): Promise<Result<void, DatabaseError | NotFoundError | ValidationError>> {
    const roleExists = await this.findRoleById(roleId);
    if (Result.isError(roleExists)) {
      return Result.err(roleExists.error);
    }

    return withDatabaseError(async () => {
      const existing = await this.getDb()
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
        .limit(1);

      if (existing.length === 0) {
        await this.getDb().insert(userRoles).values({ userId, roleId });
      }
    });
  }

  /**
   * Removes a role from a user.
   */
  async removeRoleFromUser(
    userId: string,
    roleId: string,
  ): Promise<Result<void, DatabaseError | NotFoundError>> {
    return withDatabaseError(async () => {
      await this.getDb()
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
    });
  }

  /**
   * Gets all user_role records for a user.
   */
  async getUserRoles(userId: string): Promise<Result<UserRole[], DatabaseError>> {
    return withDatabaseError(async () => {
      const records = await this.getDb()
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
      return records as UserRole[];
    });
  }

  /**
   * Gets all role IDs assigned to a user.
   */
  async getRoleIdsForUser(userId: string): Promise<Result<string[], DatabaseError>> {
    return withDatabaseError(async () => {
      const records = await this.getDb()
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
      return records.map((r: { roleId: string }) => r.roleId);
    });
  }

  /**
   * Finds the default role (where isDefault is true).
   */
  async findDefaultRole(): Promise<Result<Role, DatabaseError | NotFoundError>> {
    return withDatabaseError(async () => {
      const records = await this.getDb()
        .select()
        .from(roles)
        .where(eq(roles.isDefault, true))
        .limit(1);
      if (records.length === 0) {
        throw new NotFoundError({ resource: "Role", id: "default" });
      }
      return records[0] as Role;
    });
  }
}

/**
 * Singleton instance of the roles repository.
 */
export const rolesRepository = new RolesRepository();