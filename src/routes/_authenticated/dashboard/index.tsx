/**
 * Dashboard Route
 * Protected route that loads dashboard data and renders role-based view.
 * Total Users count is fetched client-side from /api/dashboard/metrics,
 * which returns the true total without role-based filtering.
 */

import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { APP_NAME } from "~/config";
import { RoleBasedDashboard } from "~/features/dashboard/components/role-based-views";

interface DashboardLoaderData {
  userCount: number;
}

async function dashboardLoader(): Promise<DashboardLoaderData> {
  // Total Users is fetched client-side via /api/dashboard/metrics
  // which requires only a valid session — no admin role needed.
  // The SSR loader no longer fetches /api/users?limit=1 because that
  // endpoint applies role hierarchy filtering, excluding admins/superadmins
  // from the count.
  return { userCount: 0 };
}

const route = getRouteApi("/_authenticated/dashboard/");

function DashboardWithData() {
  const loaderData = route.useLoaderData();
  return <RoleBasedDashboard userCount={loaderData?.userCount || 0} />;
}

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardWithData,
  loader: dashboardLoader,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: `${APP_NAME} Dashboard - Your personal dashboard`,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Dashboard - ${APP_NAME}`,
          description: "Your personal dashboard",
          isPartOf: { "@type": "WebSite", name: APP_NAME },
        }),
      },
    ],
  }),
});