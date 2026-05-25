import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useAnalyticsChartData } from "~/hooks/use-analytics-chart";

export function AnalyticsChart() {
  const { chartData, loading, error } = useAnalyticsChartData();

  if (loading) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={[
            {
              name: "Loading",
              clicks: 0,
              uniques: 0,
            },
          ]}
        >
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

  if (error) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={[
            {
              name: "Error",
              clicks: 0,
              uniques: 0,
            },
          ]}
        >
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

  // If no data, show empty state
  if (!chartData || chartData.length === 0) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={[
            {
              name: "No Data",
              clicks: 0,
              uniques: 0,
            },
          ]}
        >
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