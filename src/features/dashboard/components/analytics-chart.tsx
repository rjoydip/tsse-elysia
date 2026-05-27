import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useAnalyticsChartData } from "~/hooks/use-analytics-chart";
import { ChartState } from "./shared/chart-states";
import type { WeeklyRegistrationsItem } from "~/repositories/dashboard";

interface AnalyticsChartProps {
  /** Pre-fetched weekly registrations from parent Analytics component. */
  weeklyRegistrations?: WeeklyRegistrationsItem[];
}

export function AnalyticsChart({ weeklyRegistrations }: AnalyticsChartProps) {
  const { chartData, loading, error } = useAnalyticsChartData(weeklyRegistrations);

  if (loading) {
    return <ChartState variant="loading" />;
  }

  if (error) {
    return <ChartState variant="error" />;
  }

  // If no data, show empty state
  if (!chartData || chartData.length === 0) {
    return <ChartState variant="empty" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="currentColor"
          className="text-primary"
          fill="currentColor"
          fillOpacity={0.15}
        />
        <Area
          type="monotone"
          dataKey="uniques"
          stroke="currentColor"
          className="text-muted-foreground"
          fill="currentColor"
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}