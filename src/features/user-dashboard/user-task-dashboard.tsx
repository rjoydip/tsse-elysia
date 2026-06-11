/**
 * User Task Dashboard content component.
 * Renders task stats, Kanban board, and monthly chart — no Header/Main wrappers
 * so it can be embedded inside RoleBasedDashboard.
 */

import { useTaskStats } from "~/hooks/use-task-stats";
import { useDebouncedLoading } from "~/hooks/use-debounced-loading";
import { TaskStatsCards } from "./task-stats-cards";
import { MonthlyTaskChart } from "./monthly-task-chart";

/**
 * Dashboard content for regular users showing task statistics
 * and a monthly task chart.
 */
export function UserTaskDashboard() {
  const { stats, loading: statsLoading } = useTaskStats();

  // Debounce loading to avoid skeleton flash on fast responses
  const debouncedStatsLoading = useDebouncedLoading(statsLoading);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your tasks and activity.</p>
      </div>

      <TaskStatsCards stats={stats} loading={debouncedStatsLoading} />

      <MonthlyTaskChart />
    </div>
  );
}