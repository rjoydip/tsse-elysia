import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ConfigDrawer } from "~/components/config-drawer";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { Analytics } from "./components/analytics";
import { RecentUsers } from "./components/recent-users";
import { Overview } from "./components/overview";
import { useDashboardMetrics } from "~/hooks/use-dashboard-metrics";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "./components/shared/animated-number";

export function Dashboard() {
  const { metrics, error } = useDashboardMetrics();
  const [activeTab, setActiveTab] = useState("overview");

  const totalUsers = metrics?.totalUsers ?? 0;
  const activeUsers = metrics?.activeUsers ?? 0;
  const inactiveUsers = metrics?.inactiveUsers ?? 0;
  const suspendedUsers = metrics?.suspendedUsers ?? 0;

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className="mb-2 flex items-center justify-between space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Tabs
          orientation="vertical"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
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
          <TabsContent key={`overview-${activeTab}`} value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0 }}
              >
                <Card className="border-l-4 border-l-purple-500">
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
                      <AnimatedNumber value={totalUsers} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="border-l-4 border-l-emerald-500">
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
                      <AnimatedNumber value={activeUsers} enterDelay={100} />
                    </div>
                    {error && <p className="text-xs text-destructive">Failed to load</p>}
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="border-l-4 border-l-amber-500">
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
                      <AnimatedNumber value={inactiveUsers} enterDelay={200} />
                    </div>
                    {error && <p className="text-xs text-destructive">Failed to load</p>}
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className="border-l-4 border-l-red-500">
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
                      <AnimatedNumber value={suspendedUsers} enterDelay={300} />
                    </div>
                    {error && <p className="text-xs text-destructive">Failed to load</p>}
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
                    <CardTitle>User Registrations</CardTitle>
                    <CardDescription>
                      Monthly user registrations for the current year
                    </CardDescription>
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
                    <CardDescription>Latest registered users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentUsers />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          <TabsContent key={`analytics-${activeTab}`} value="analytics" className="space-y-4">
            <Analytics />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}