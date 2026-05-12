/**
 * Dashboard Route
 * Protected route that loads dashboard data and renders role-based view.
 */

import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { BASE_URL, APP_NAME } from "~/config";
import { RoleBasedDashboard } from "~/features/dashboard/components/role-based-views";

interface DashboardLoaderData {
  userCount: number;
}

async function dashboardLoader(): Promise<DashboardLoaderData> {
  try {
    const response = await fetch(`${BASE_URL}/api/users?limit=1`);
    if (!response.ok) {
      return { userCount: 0 };
    }
    const data = (await response.json()) as { pagination: { total: number } };
    return { userCount: data.pagination?.total || 0 };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return { userCount: 0 };
  }
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