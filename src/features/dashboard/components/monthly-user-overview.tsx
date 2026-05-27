import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useDashboardChartData } from "~/hooks/use-dashboard-chart";
import { motion } from "motion/react";
import { ChartState } from "./shared/chart-states";

export function MonthlyUsersOverview() {
  const { monthlyData, loading, error } = useDashboardChartData();

  if (loading) {
    return <ChartState variant="loading" chartType="bar" />;
  }

  if (error) {
    return <ChartState variant="error" chartType="bar" />;
  }

  // If no data or all values are zero, show empty state
  if (!monthlyData || monthlyData.every((item) => item.total === 0)) {
    return <ChartState variant="empty" chartType="bar" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={monthlyData}>
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}