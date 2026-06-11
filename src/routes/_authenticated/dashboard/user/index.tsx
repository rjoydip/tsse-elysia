/**
 * User Dashboard route.
 * Shows personal task management dashboard with stats, Kanban board, and charts.
 */

import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "~/components/auth/auth-guard";
import { UserDashboard } from "~/features/user-dashboard";

function UserDashboardWithGuard() {
  return (
    <AuthGuard>
      <UserDashboard />
    </AuthGuard>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard/user/")({
  component: UserDashboardWithGuard,
});