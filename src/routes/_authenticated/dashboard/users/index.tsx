import z from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "~/components/auth/auth-guard";
import { Users } from "~/features/users";
import { roles } from "~/features/users/data/data";
import { usersActions, useUsersStore } from "~/lib/stores/dashboard/users";
import { useEffect } from "react";

function UsersWithGuard() {
  const { users, loading, error } = useUsersStore();

  useEffect(() => {
    if (users.length === 0) {
      usersActions.fetchAll();
    }
  }, []);

  return (
    <AuthGuard>
      <Users initialUsers={users} isLoading={loading} error={error} />
    </AuthGuard>
  );
}

const usersSearchSchema = z.object({
  page: z.coerce.number().optional().catch(1),
  pageSize: z.coerce.number().optional().catch(10),
  status: z
    .array(
      z.union([
        z.literal("active"),
        z.literal("inactive"),
        z.literal("invited"),
        z.literal("suspended"),
      ]),
    )
    .optional()
    .catch([]),
  role: z
    .array(z.enum(roles.map((r) => r.value as (typeof roles)[number]["value"])))
    .optional()
    .catch([]),
  username: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/dashboard/users/")({
  validateSearch: usersSearchSchema,
  component: UsersWithGuard,
});