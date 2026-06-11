/**
 * Monthly task line chart for the user dashboard.
 * Shows created, completed, and archived task counts by month with a year dropdown.
 */

import { useState, useRef } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ChartState } from "~/features/dashboard/components/shared/chart-states";
import { useMonthlyTasks } from "~/hooks/use-monthly-tasks";
import { useDebouncedLoading } from "~/hooks/use-debounced-loading";
import { MONTH_NAMES } from "~/config/date";
import type { MonthlyTaskData } from "~/hooks/use-monthly-tasks";

/**
 * Generates year options for the dropdown (current year and 3 years back).
 */
function getYearOptions(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 4 }, (_, i) => current - i);
}

/**
 * Monthly task chart with line graph and year selector.
 * Keeps stale chart visible while loading a new year — only the graph refreshes.
 */
export function MonthlyTaskChart() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { data, loading, error } = useMonthlyTasks(selectedYear);
  const debouncedLoading = useDebouncedLoading(loading);
  const years = getYearOptions();

  // Keep last known good data so the chart stays visible during year-switch loading
  const lastData = useRef<MonthlyTaskData[]>([]);
  if (!loading && data.length > 0) {
    lastData.current = data;
  }

  const hasEverLoaded = lastData.current.length > 0;

  // Use cached data during loading to avoid replacing chart with skeleton
  const displayData = loading && hasEverLoaded ? lastData.current : data;

  const chartData = displayData.map((item) => ({
    name: MONTH_NAMES[item.month - 1] ?? `Month ${item.month}`,
    Created: item.created,
    Completed: item.completed,
    Archived: item.archived,
  }));

  const isEmpty = chartData.every((d) => d.Created === 0 && d.Completed === 0 && d.Archived === 0);

  const yearSelector = (
    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
      <SelectTrigger className="w-24 h-8 text-xs">
        <SelectValue placeholder={String(selectedYear)} />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)} className="text-xs">
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Only show full-screen skeleton on very first load (no data ever)
  if (debouncedLoading && !hasEverLoaded) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Monthly Tasks</CardTitle>
          {yearSelector}
        </CardHeader>
        <CardContent>
          <ChartState variant="loading" chartType="area" />
        </CardContent>
      </Card>
    );
  }

  if (error && !hasEverLoaded) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Monthly Tasks</CardTitle>
          {yearSelector}
        </CardHeader>
        <CardContent>
          <ChartState variant="error" chartType="area" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-purple-50/60 to-background dark:from-purple-950/20 dark:to-background">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Monthly Tasks</CardTitle>
          {yearSelector}
        </CardHeader>
        <CardContent className="ps-2">
          {isEmpty && (
            <div className="mb-4">
              <ChartState variant="empty" chartType="area" />
            </div>
          )}
          {!isEmpty && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
                        <p className="font-medium mb-1">{label}</p>
                        {payload.map((entry) => (
                          <p key={entry.name} style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                          </p>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="Created"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Completed"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Archived"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}