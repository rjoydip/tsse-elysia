/**
 * Roles & Permissions Settings Route.
 * Protected route for managing roles and permissions.
 */

import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "~/config";
import { AuthGuard } from "~/components/auth/auth-guard";
import { RolesPermissionsPage } from "~/features/roles";

/**
 * Roles and permissions settings page component with authentication guard.
 */
function RolesPermissionsWithGuard() {
  return (
    <AuthGuard>
      <RolesPermissionsPage />
    </AuthGuard>
  );
}

/**
 * Route definition for roles & permissions settings.
 */
// @ts-ignore - TanStack Router file route type inference
export const Route = createFileRoute("/_authenticated/dashboard/roles/")({
  component: RolesPermissionsWithGuard,
  loader: async () => ({}),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: `${APP_NAME} Roles & Permissions - Manage user roles and permissions`,
      },
    ],
  }),
});