import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

/**
 * Shared chart loading state component
 */
export function ChartLoadingState() {
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

/**
 * Shared chart error state component
 */
export function ChartErrorState() {
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

/**
 * Shared chart empty state component
 */
export function ChartEmptyState() {
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

/**
 * Shared bar chart loading state component
 */
export function BarChartLoadingState() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={[
          {
            name: "Loading",
            total: 0,
          },
        ]}
      >
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis dataKey="total" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Shared bar chart error state component
 */
export function BarChartErrorState() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={[
          {
            name: "Error",
            total: 0,
          },
        ]}
      >
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis dataKey="total" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Shared bar chart empty state component
 */
export function BarChartEmptyState() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={[
          {
            name: "No Data",
            total: 0,
          },
        ]}
      >
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis dataKey="total" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  );
}