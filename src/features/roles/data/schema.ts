/**
 * Roles and permissions data schema definitions.
 */

import { z } from "zod";

/**
 * Permission schema matching the API response.
 */
export const permissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Permission = z.infer<typeof permissionSchema>;

/**
 * Role schema matching the API response.
 */
export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  permissions: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Role = z.infer<typeof roleSchema>;

/**
 * Form schema for creating/editing a permission.
 */
export const permissionFormSchema = z.object({
  name: z.string().min(1, "Permission name is required."),
  description: z.string().default(""),
});
export type PermissionForm = z.infer<typeof permissionFormSchema>;

/**
 * Form schema for creating/editing a role.
 */
export const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required."),
  description: z.string().default(""),
  isDefault: z.boolean().default(false),
  permissionIds: z.array(z.string()).default([]),
});
export type RoleForm = z.infer<typeof roleFormSchema>;