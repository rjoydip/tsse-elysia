/**
 * Role-Based Dashboard Views
 * Renders different dashboard components based on user permissions and role.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
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
import { dashboardService } from "~/services/dashboard";
import type { DashboardMetrics } from "~/services/dashboard";
import { Overview } from "./overview";
import { RecentUsers } from "./recent-users";
import { Analytics } from "./analytics";
import { motion } from "motion/react";
import { currencyConfig } from "~/config";
import { AnimatedNumber } from "./shared/animated-number";

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
export function BasicDashboard({ userCount: _userCount = 0 }: RoleBasedDashboardProps) {
  const { role } = usePermission();
  const { metrics, loading, error } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Welcome, {role}</h2>
          <span className="text-sm text-muted-foreground">Basic View</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
              <p className="text-xs text-muted-foreground">Tasks completed today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
              <p className="text-xs text-muted-foreground">Tasks waiting for you</p>
            </CardContent>
          </Card>
        </div>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">--</div>
              <p className="text-xs text-muted-foreground">Tasks completed today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">--</div>
              <p className="text-xs text-muted-foreground">Tasks waiting for you</p>
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Welcome, {role}</h2>
        <span className="text-sm text-muted-foreground">Basic View</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.salesCount?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">Tasks completed today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.refundsCount?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">Tasks waiting for you</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Sales Dashboard - For cashiers.
 * Focuses on sales metrics and transactions.
 */
export function SalesDashboard({ userCount: _userCount }: RoleBasedDashboardProps) {
  const { metrics, loading, error } = useDashboardMetrics();

  if (loading) {
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
              <Skeleton className="h-9 w-20" />
              <p className="text-xs text-muted-foreground">+0% from yesterday</p>
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
              <Skeleton className="h-9 w-20" />
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
              <Skeleton className="h-9 w-20" />
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
              <Skeleton className="h-9 w-20" />
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

  if (error) {
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
              <div className="text-2xl font-bold text-destructive">--</div>
              <p className="text-xs text-muted-foreground">+0% from yesterday</p>
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
              <div className="text-2xl font-bold text-destructive">--</div>
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
              <div className="text-2xl font-bold text-destructive">--</div>
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
              <div className="text-2xl font-bold text-destructive">--</div>
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
export function TeamDashboard({ userCount: _userCount }: RoleBasedDashboardProps) {
  const { metrics, loading, error } = useDashboardMetrics();

  if (loading) {
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
              <Skeleton className="h-9 w-20" />
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
              <Skeleton className="h-9 w-20" />
              <p className="text-xs text-muted-foreground">+0% from last month</p>
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
              <Skeleton className="h-9 w-20" />
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
              <Skeleton className="h-9 w-20" />
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
              <Overview />
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
              <div className="text-2xl font-bold text-destructive">--</div>
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
              <div className="text-2xl font-bold text-destructive">--</div>
              <p className="text-xs text-muted-foreground">+0% from last month</p>
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
              <div className="text-2xl font-bold text-destructive">--</div>
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
              <div className="text-2xl font-bold text-destructive">--</div>
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
              <Overview />
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
            <Overview />
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
export function FullDashboard({ userCount: initialUserCount = 0 }: RoleBasedDashboardProps) {
  const [userCount, setUserCount] = useState(initialUserCount);
  const [loading, setLoading] = useState(!initialUserCount);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullDashTab, setFullDashTab] = useState("overview");

  useEffect(() => {
    let isMounted = true;

    // Fetch initial data
    async function fetchInitialData() {
      try {
        setLoading(true);
        setMetricsLoading(true);

        // Fetch user count
        const userResponse = await fetch("/api/users?limit=1");
        let userCountValue = initialUserCount;
        if (userResponse.ok) {
          const userData = (await userResponse.json()) as { pagination: { total: number } };
          userCountValue = userData.pagination?.total ?? 0;
        }

        // Fetch metrics
        const metricsData = await dashboardService.getMetrics();

        if (isMounted) {
          setUserCount(userCountValue);
          setMetrics(metricsData);
          setLoading(false);
          setMetricsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch dashboard data:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
          setLoading(false);
          setMetricsLoading(false);
        }
      }
    }

    // Set up real-time updates
    const unsubscribe = dashboardService.subscribeToUpdates(
      (update) => {
        if (!isMounted) return;

        // Handle different types of updates
        if (update.resource === "metrics") {
          setMetrics((prev: DashboardMetrics | null) => ({
            ...prev,
            ...(update.data as DashboardMetrics),
          }));
        } else if (update.resource === "stats" && update.action === "update") {
          // Handle specific stat updates
          if (update.data.userCount !== undefined) {
            setUserCount(update.data.userCount);
          }
          if (update.data.totalRevenue !== undefined) {
            setMetrics((prev: DashboardMetrics | null) => ({
              ...prev,
              totalRevenue: update.data.totalRevenue,
            }));
          }
        }
      },
      ["metrics", "stats"],
    );

    // Initial fetch
    if (!initialUserCount) {
      fetchInitialData();
    }

    // Cleanup
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [initialUserCount]);

  // If we have an error, show it
  if (error) {
    return (
      <Tabs orientation="vertical" defaultValue="overview" className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger
              value="overview"
              className="data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
            <TabsTrigger value="notifications" disabled>
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="space-y-4">
          <div className="text-center text-muted-foreground py-12">
            Failed to load dashboard data: {error}
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Analytics />
        </TabsContent>
      </Tabs>
    );
  }

  // If loading, show skeletons
  if (loading || metricsLoading) {
    return (
      <Tabs orientation="vertical" defaultValue="overview" className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger
              value="overview"
              className="data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
            <TabsTrigger value="notifications" disabled>
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>
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
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      <AnimatedNumber
                        value={userCount}
                        format={(n) => `+${n.toLocaleString()}`}
                        enterDelay={100}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{(metrics?.salesGrowth ?? 0).toFixed(1)}% from last month
                    </p>
                  </>
                )}
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
                {metricsLoading ? (
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
                {metricsLoading ? (
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
                {metricsLoading ? (
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
                {metricsLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      <AnimatedNumber
                        value={metrics?.activeNow ?? 0}
                        format={(n) => `+${n.toLocaleString()}`}
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
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="ps-2">
                <Overview />
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
                <RecentUsers />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Analytics />
        </TabsContent>
      </Tabs>
    );
  }

  // Display the actual data
  return (
    <Tabs
      orientation="vertical"
      value={fullDashTab}
      onValueChange={setFullDashTab}
      className="space-y-4"
    >
      <div className="w-full overflow-x-auto pb-2">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports" disabled>
            Reports
          </TabsTrigger>
          <TabsTrigger value="notifications" disabled>
            Notifications
          </TabsTrigger>
        </TabsList>
      </div>
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
                  <AnimatedNumber
                    value={userCount}
                    format={(n) => `+${n.toLocaleString()}`}
                    enterDelay={100}
                  />
                </div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
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
                    format={(n) => `+${n.toLocaleString()}`}
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
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="ps-2">
                <Overview />
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
                <RecentUsers />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </TabsContent>
      <TabsContent key={`analytics-${fullDashTab}`} value="analytics" className="space-y-4">
        <Analytics />
      </TabsContent>
    </Tabs>
  );
}

import { useEffect, useState } from "react";

/**
 * Role-based dashboard router.
 * Returns the appropriate dashboard component based on user role.
 */
export function RoleBasedDashboard(props: RoleBasedDashboardProps) {
  const { dashboardView } = usePermission();

  const DashboardComponent = (() => {
    switch (dashboardView) {
      case "full":
        return FullDashboard;
      case "team":
        return TeamDashboard;
      case "sales":
        return SalesDashboard;
      case "analytics":
        return FullDashboard;
      case "basic":
      default:
        return BasicDashboard;
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