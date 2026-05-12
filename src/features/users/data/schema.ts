/**
 * User data schema definitions.
 * Note: Role types are centralized in src/lib/auth/permissions.ts
 */

import { z } from "zod";
import { userRoleSchema } from "~/lib/auth/permissions";

export type { UserRole } from "~/lib/auth/permissions";
export { userRoleSchema } from "~/lib/auth/permissions";

const userStatusSchema = z.union([
  z.literal("active"),
  z.literal("inactive"),
  z.literal("invited"),
  z.literal("suspended"),
]);
export type UserStatus = z.infer<typeof userStatusSchema>;

const _userSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  username: z.string().nullable(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  status: userStatusSchema,
  role: userRoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof _userSchema>;