import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

/**
 * Props for the ChartState component.
 */
export interface ChartStateProps {
  variant: "loading" | "error" | "empty";
  chartType?: "area" | "bar";
}

/**
 * Shared chart state component that renders loading, error, or empty states
 * for both area and bar charts.
 */
export function ChartState({ variant, chartType = "area" }: ChartStateProps) {
  const label = variant === "loading" ? "Loading" : variant === "error" ? "Error" : "No Data";

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={[
            {
              name: label,
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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={[
          {
            name: label,
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