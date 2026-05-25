import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AnalyticsChart } from "./analytics-chart";
import { SimpleBarList } from "~/components/shared/simple-bar-list";
import { useDashboardAnalytics } from "~/hooks/use-dashboard-analytics";
import { motion } from "motion/react";
import { AnalyticsLoadingState, AnalyticsErrorState } from "./shared/analytics-states";

export function Analytics() {
  const { roleDistribution, statusDistribution, loading, error } = useDashboardAnalytics();

  if (loading) {
    return <AnalyticsLoadingState />;
  }

  if (error) {
    return <AnalyticsErrorState error={error} />;
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