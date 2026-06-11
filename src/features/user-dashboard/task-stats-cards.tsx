/**
 * Task stats cards for the user dashboard.
 * Shows animated metric cards: total, archived, deleted, and status-breakdown chips.
 */

import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { AnimatedNumber } from "~/features/dashboard/components/shared/animated-number";
import { ListTodo, Archive, Trash2, Timer } from "lucide-react";
import type { TaskStats } from "~/hooks/use-task-stats";

/**
 * Props for the TaskStatsCards component.
 */
export interface TaskStatsCardsProps {
  stats: TaskStats | null;
  loading: boolean;
}

/**
 * Individual metric card with icon, animated number, and subtitle.
 */
function MetricCard({
  title,
  value,
  icon: Icon,
  colorClass,
  delay,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  delay: number;
  subtitle?: string;
}) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={`h-full border-l-4 ${colorClass}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
          <CardTitle className="text-xs font-medium">{title}</CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80">
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold">
            <AnimatedNumber value={value} enterDelay={delay * 1000} />
          </div>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Stats cards grid showing task overview metrics.
 */
export function TaskStatsCards({ stats, loading }: TaskStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-full animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-8 w-8 rounded-full bg-muted" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="mb-1 h-7 w-14 rounded bg-muted" />
              <div className="h-2.5 w-16 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const s = stats ?? {
    total: 0,
    active: 0,
    archived: 0,
    deleted: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    backlog: 0,
    canceled: 0,
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Tasks"
          value={s.total}
          icon={ListTodo}
          colorClass="border-l-purple-500"
          delay={0}
          subtitle="All tasks"
        />
        <MetricCard
          title="Active Tasks"
          value={s.active}
          icon={Timer}
          colorClass="border-l-cyan-500"
          delay={0.1}
          subtitle="In progress"
        />
        <MetricCard
          title="Archived Tasks"
          value={s.archived}
          icon={Archive}
          colorClass="border-l-amber-500"
          delay={0.2}
        />
        <MetricCard
          title="Deleted Tasks"
          value={s.deleted}
          icon={Trash2}
          colorClass="border-l-red-500"
          delay={0.3}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <StatusChip
          label="Todo"
          count={s.todo}
          color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatusChip
          label="In Progress"
          count={s.inProgress}
          color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
        />
        <StatusChip
          label="Review"
          count={s.review}
          color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        />
        <StatusChip
          label="Done"
          count={s.done}
          color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        />
        <StatusChip
          label="Backlog"
          count={s.backlog}
          color="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
        />
        <StatusChip
          label="Canceled"
          count={s.canceled}
          color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        />
      </div>
    </div>
  );
}

/**
 * Small status chip showing a count.
 */
function StatusChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${color}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{count}</span>
    </motion.span>
  );
}