/**
 * Role-Based Dashboard Views
 * Renders different dashboard components based on user permissions and role.
 */

import { DashboardTabs } from "./dashboard-tabs";
import { TabsContent } from "~/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { ConfigDrawer } from "~/components/config-drawer";
import { ThemeSwitch } from "~/components/theme-switch";
import { Search } from "~/components/search";
import { usePermission } from "~/hooks/use-permission";
import { useDashboardMetrics } from "~/hooks/use-dashboard-metrics";
import {
  dashboardService as realtimeDashboardService,
  DashboardResource,
} from "~/services/dashboard/main";
import type { DashboardMetrics } from "~/repositories/dashboard";
import { MonthlyUsersOverview } from "./monthly-user-overview";
import { RecentUsers } from "./recent-users";
import { Analytics } from "./analytics";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { currencyConfig } from "~/config";
import { AnimatedNumber } from "./shared/animated-number";
import { DashboardState, DashboardMetricCard } from "./shared/role-view-states";

/**
 * Props for the role-specific dashboard views.
 */
export interface RoleBasedDashboardProps {
  userCount?: number;
}

/**
 * Basic Dashboard - For regular users.
 * Shows minimal metrics and simple interface.
 */
export function BasicDashboard({ userCount = 0 }: RoleBasedDashboardProps) {
  const { role } = usePermission();
  const { metrics, loading, error } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Welcome, {role}</h2>
          <span className="text-sm text-muted-foreground">Basic View</span>
        </div>
        <DashboardState variant="loading" view="basic" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Welcome, {role}</h2>
          <span className="text-sm text-muted-foreground">Basic View</span>
        </div>
        <DashboardState variant="error" view="basic" />
        <div className="text-center text-muted-foreground mt-4">
          Failed to load dashboard data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Welcome, {role}</h2>
        <span className="text-sm text-muted-foreground">Basic View</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardMetricCard
          headerStyle="basic"
          title="Your Activity"
          value={userCount.toLocaleString() ?? 0}
          subtitle="Total users"
          icon={null}
        />
        <DashboardMetricCard
          headerStyle="basic"
          title="Pending Tasks"
          value={metrics?.inactiveUsers?.toLocaleString() ?? 0}
          subtitle="Inactive users"
          icon={null}
        />
      </div>
    </div>
  );
}

/**
 * Sales Dashboard - For cashiers.
 * Focuses on sales metrics and transactions.
 */
export function SalesDashboard(_props: RoleBasedDashboardProps) {
  const { metrics, loading, error } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sales Dashboard</h2>
        <DashboardState variant="loading" view="sales" />
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest sales and refunds</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentUsers />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sales Dashboard</h2>
        <DashboardState variant="error" view="sales" />
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest sales and refunds</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentUsers />
          </CardContent>
        </Card>
        <div className="text-center text-muted-foreground mt-4">
          Failed to load dashboard data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Sales Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M6 2h3M6 6h9a3.5 3.5 0 0 1 0 7H6M4 10h14M6 17h10" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalRevenue?.toLocaleString(currencyConfig.locale, {
                style: "currency",
                currency: currencyConfig.code,
              }) ?? `${currencyConfig.symbol}0.00`}
            </div>
            <p className="text-xs text-muted-foreground">
              {(metrics?.revenueGrowth ?? 0) >= 0 ? "+" : ""}
              {(metrics?.revenueGrowth ?? 0).toFixed(1)}% from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.salesCount?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">Processed today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunds</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.refundsCount?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">Processed today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeNow?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">Customers online</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest sales and refunds</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentUsers />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Team Dashboard - For managers.
 * Shows team metrics and performance.
 */
export function TeamDashboard(_props: RoleBasedDashboardProps) {
  const { metrics, loading, error } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Team Dashboard</h2>
        <DashboardState variant="loading" view="team" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
            </CardHeader>
            <CardContent className="ps-2">
              <MonthlyUsersOverview />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Team activity feed</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentUsers />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Team Dashboard</h2>
        <DashboardState variant="error" view="team" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
            </CardHeader>
            <CardContent className="ps-2">
              <MonthlyUsersOverview />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Team activity feed</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentUsers />
            </CardContent>
          </Card>
        </div>
        <div className="text-center text-muted-foreground mt-4">
          Failed to load dashboard data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Team Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.salesGrowth?.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Team quota achieved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Sales</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M6 2h3M6 6h9a3.5 3.5 0 0 1 0 7H6M4 10h14M6 17h10" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalRevenue?.toLocaleString(currencyConfig.locale, {
                style: "currency",
                currency: currencyConfig.code,
              }) ?? `${currencyConfig.symbol}0.00`}
            </div>
            <p className="text-xs text-muted-foreground">
              +{(metrics?.revenueGrowth ?? 0).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.salesCount?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeNow?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">Team members online</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent className="ps-2">
            <MonthlyUsersOverview />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Team activity feed</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentUsers />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Full Dashboard - For admins and superadmins.
 * Shows all metrics and management options.
 */
export function FullDashboard(_props: RoleBasedDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullDashTab, setFullDashTab] = useState("overview");
  const [loadedUserCount, setLoadedUserCount] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchMetrics() {
      try {
        setLoading(true);

        // Fetch metrics — the single source of truth for all counts
        const metricsResponse = await fetch("/api/dashboard/metrics", {
          signal: abortController.signal,
        });
        const metricsData = metricsResponse.ok ? await metricsResponse.json() : null;

        if (!abortController.signal.aborted) {
          setMetrics(metricsData);
          setLoading(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error("Failed to fetch dashboard data:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
          setLoading(false);
        }
      }
    }

    // Set up real-time updates
    const subscriptionId = Math.random().toString(36).substr(2, 9);
    realtimeDashboardService.subscribe(subscriptionId, ["metrics", "stats"] as DashboardResource[]);
    const unsubscribe = () => {
      realtimeDashboardService.unsubscribe(subscriptionId, ["metrics", "stats"] as any[]);
    };

    fetchMetrics();

    // Cleanup
    return () => {
      abortController.abort();
      unsubscribe();
    };
  }, []);

  // If we have an error, show it
  if (error) {
    return (
      <DashboardTabs value="overview">
        <TabsContent value="overview" className="space-y-4">
          <div className="text-center text-muted-foreground py-12">
            Failed to load dashboard data: {error}
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Analytics />
        </TabsContent>
      </DashboardTabs>
    );
  }

  // If loading, show skeletons
  if (loading) {
    return (
      <DashboardTabs value="overview">
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="h-full border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-purple-700 dark:text-purple-300"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={metrics?.totalUsers ?? 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  +{(metrics?.userGrowth ?? 0).toFixed(1)}% active rate
                </p>
              </CardContent>
            </Card>
            <Card className="h-full border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-cyan-700 dark:text-cyan-300"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    <AnimatedNumber value={metrics?.activeUsers ?? 0} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="h-full border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-amber-700 dark:text-amber-300"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    <AnimatedNumber value={metrics?.inactiveUsers ?? 0} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="h-full border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-red-700 dark:text-red-300"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m15 9-6 6M9 9l6 6" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    <AnimatedNumber value={metrics?.suspendedUsers ?? 0} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="h-full border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-emerald-700 dark:text-emerald-300"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      <AnimatedNumber
                        value={metrics?.activeNow ?? 0}
                        format={(n) => `${n.toLocaleString()}`}
                        enterDelay={300}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{(metrics?.activeNowGrowth ?? 0).toFixed(1)} since last hour
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4 bg-gradient-to-br from-purple-50/60 to-background dark:from-purple-950/20 dark:to-background">
              <CardHeader>
                <CardTitle>Monthly Users</CardTitle>
              </CardHeader>
              <CardContent className="ps-2">
                <MonthlyUsersOverview />
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3 bg-gradient-to-br from-emerald-50/60 to-background dark:from-emerald-950/20 dark:to-background">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>
                  You made {metrics?.usersThisMonth?.toLocaleString() ?? 0} users this month.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentUsers
                  onLoadCountChange={setLoadedUserCount}
                  max={metrics?.usersThisMonth ?? undefined}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Analytics />
        </TabsContent>
      </DashboardTabs>
    );
  }

  // Display the actual data
  return (
    <DashboardTabs value={fullDashTab} onValueChange={setFullDashTab}>
      <TabsContent key={`overview-${fullDashTab}`} value="overview" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
          >
            <Card className="h-full border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-purple-700 dark:text-purple-300"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={metrics?.totalUsers ?? 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  +{metrics?.userGrowth ?? 0}% from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="h-full border-l-4 border-l-cyan-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-cyan-700 dark:text-cyan-300"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={metrics?.activeUsers ?? 0} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="h-full border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-amber-700 dark:text-amber-300"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={metrics?.inactiveUsers ?? 0} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="h-full border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-red-700 dark:text-red-300"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m15 9-6 6M9 9l6 6" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={metrics?.suspendedUsers ?? 0} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="h-full border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-emerald-700 dark:text-emerald-300"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={metrics?.activeNow ?? 0}
                    format={(n) => `${n.toLocaleString()}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  +{(metrics?.activeNowGrowth ?? 0).toFixed(1)} since last hour
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          <motion.div
            className="col-span-1 lg:col-span-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="col-span-1 lg:col-span-4 bg-gradient-to-br from-purple-50/60 to-background dark:from-purple-950/20 dark:to-background">
              <CardHeader>
                <CardTitle>Monthly Users</CardTitle>
              </CardHeader>
              <CardContent className="ps-2">
                <MonthlyUsersOverview />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            className="col-span-1 lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="col-span-1 lg:col-span-3 bg-gradient-to-br from-emerald-50/60 to-background dark:from-emerald-950/20 dark:to-background">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>
                  You made {metrics?.usersThisMonth?.toLocaleString() ?? 0} users this month.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentUsers
                  onLoadCountChange={setLoadedUserCount}
                  max={metrics?.usersThisMonth ?? undefined}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </TabsContent>
      <TabsContent key={`analytics-${fullDashTab}`} value="analytics" className="space-y-4">
        <Analytics />
      </TabsContent>
    </DashboardTabs>
  );
}

/**
 * Analytics Dashboard - For users who need analytics views.
 * Focuses on charts and distribution data.
 */
export function AnalyticsDashboard(_props: RoleBasedDashboardProps) {
  return (
    <div className="space-y-4">
      <Analytics />
    </div>
  );
}

/**
 * Role-based dashboard router.
 * Returns the appropriate dashboard component based on user role.
 */
export function RoleBasedDashboard(props: RoleBasedDashboardProps) {
  const { dashboardView, isPending } = usePermission();

  // Show full-page skeleton while session/role is being resolved to prevent
  // a flash of the wrong dashboard view (e.g., user dashboard before admin)
  if (isPending) {
    return (
      <>
        <Header>
          <div className="ms-auto flex items-center space-x-4">
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="space-y-4">
            {/* Skeleton tabs */}
            <div className="w-full overflow-x-auto pb-2">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>
            {/* Skeleton metric cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="mb-2 h-9 w-20" />
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Skeleton overview + recent users row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                  <Skeleton className="h-5 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="mt-1 h-3 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Main>
      </>
    );
  }

  const DashboardComponent = (() => {
    switch (dashboardView) {
      case "full":
        return FullDashboard;
      case "team":
        return TeamDashboard;
      case "sales":
        return SalesDashboard;
      case "analytics":
        return AnalyticsDashboard;
      case "basic":
        return BasicDashboard;
      default:
        return () => (
          <div className="text-center text-muted-foreground py-12">
            No dashboard view available for your role.
          </div>
        );
    }
  })();

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <DashboardComponent {...props} />
      </Main>
    </>
  );
}