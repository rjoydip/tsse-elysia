import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AnalyticsChart } from "./analytics-chart";
import { SimpleBarList } from "~/components/shared/simple-bar-list";
import { useDashboardAnalytics } from "~/hooks/use-dashboard-analytics";
import { Skeleton } from "~/components/ui/skeleton";
import { motion } from "motion/react";

export function Analytics() {
  const { roleDistribution, statusDistribution, loading, error } = useDashboardAnalytics();

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Weekly User Registrations</CardTitle>
            <CardDescription>New users registered per day this week</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <AnalyticsChart />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6M9 9l6 6" />
              </svg>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-8">
          <Card className="col-span-1 lg:col-span-5">
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>User distribution across roles</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarList items={[]} barClass="bg-primary" valueFormatter={(n) => `${n}`} />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Users by Status</CardTitle>
              <CardDescription>Active, inactive, and suspended users</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarList
                items={[]}
                barClass="bg-muted-foreground"
                valueFormatter={(n) => `${n}%`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Weekly User Registrations</CardTitle>
            <CardDescription>New users registered per day this week</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <AnalyticsChart />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">--</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">--</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6M9 9l6 6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">--</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-8">
          <Card className="col-span-1 lg:col-span-5">
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>User distribution across roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Failed to load role distribution: {error}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Users by Status</CardTitle>
              <CardDescription>Active, inactive, and suspended users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Failed to load status distribution: {error}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayRoleDistribution =
    roleDistribution.length > 0 ? roleDistribution : [{ name: "No Data", value: 0 }];

  const displayStatusDistribution =
    statusDistribution.length > 0 ? statusDistribution : [{ name: "No Data", value: 0 }];

  // Calculate percentages for status distribution
  const totalForStatus = displayStatusDistribution.reduce(
    (sum: number, d: any) => sum + d.value,
    0,
  );

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-purple-50/60 to-background dark:from-purple-950/20 dark:to-background">
          <CardHeader>
            <CardTitle>Weekly User Registrations</CardTitle>
            <CardDescription>New users registered per day this week</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <AnalyticsChart />
          </CardContent>
        </Card>
      </motion.div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-8">
        <motion.div
          className="col-span-1 lg:col-span-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="col-span-1 lg:col-span-5 bg-gradient-to-br from-blue-50/60 to-background dark:from-blue-950/20 dark:to-background">
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>User distribution across roles</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarList
                items={displayRoleDistribution}
                barClass="bg-primary"
                valueFormatter={(n) => `${n}`}
              />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          className="col-span-1 lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="col-span-1 lg:col-span-3 bg-gradient-to-br from-amber-50/60 to-background dark:from-amber-950/20 dark:to-background">
            <CardHeader>
              <CardTitle>Users by Status</CardTitle>
              <CardDescription>Active, inactive, and suspended users</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarList
                items={displayStatusDistribution}
                barClass="bg-muted-foreground"
                valueFormatter={(n) =>
                  totalForStatus > 0 ? `${Math.round((n / totalForStatus) * 100)}%` : "0%"
                }
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}