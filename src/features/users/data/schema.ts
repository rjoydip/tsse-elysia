import { z } from "zod";

const userStatusSchema = z.union([
  z.literal("active"),
  z.literal("inactive"),
  z.literal("invited"),
  z.literal("suspended"),
]);
export type UserStatus = z.infer<typeof userStatusSchema>;

const userRoleSchema = z.union([
  z.literal("superadmin"),
  z.literal("admin"),
  z.literal("manager"),
  z.literal("cashier"),
  z.literal("user"),
]);
export type UserRole = z.infer<typeof userRoleSchema>;

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