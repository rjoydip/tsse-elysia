/**
 * Reusable Tabs component for dashboard views.
 * Provides consistent tab navigation across all dashboard states.
 */

import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export function DashboardTabs({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Tabs
      orientation="vertical"
      defaultValue="overview"
      className="space-y-4"
      value={value}
      onValueChange={onValueChange}
    >
      <div className="w-full overflow-x-auto pb-2">
        <TabsList>
          <TabsTrigger
            value="overview"
            className="data-[state=active]:!text-purple-600 data-[state=active]:hover:!text-purple-700 dark:data-[state=active]:!text-purple-400 dark:data-[state=active]:hover:!text-purple-300"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:!text-purple-600 data-[state=active]:hover:!text-purple-700 dark:data-[state=active]:!text-purple-400 dark:data-[state=active]:hover:!text-purple-300"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="data-[state=active]:!text-purple-600 data-[state=active]:hover:!text-purple-700 dark:data-[state=active]:!text-purple-400 dark:data-[state=active]:hover:!text-purple-300"
            disabled
          >
            Reports
          </TabsTrigger>
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}