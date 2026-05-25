import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useDashboardChartData } from "~/hooks/use-dashboard-chart";
import { motion } from "motion/react";
import {
  BarChartLoadingState,
  BarChartErrorState,
  BarChartEmptyState,
} from "./shared/chart-states";

export function Overview() {
  const { monthlyData, loading, error } = useDashboardChartData();

  if (loading) {
    return <BarChartLoadingState />;
  }

  if (error) {
    return <BarChartErrorState />;
  }

  // If no data, show empty state
  if (!monthlyData || monthlyData.length === 0) {
    return <BarChartEmptyState />;
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