import z from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "~/components/auth/auth-guard";
import { Tasks } from "~/features/tasks";
import { priorities, statuses } from "~/features/tasks/data/data";

function TasksWithGuard() {
  return (
    <AuthGuard>
      <Tasks />
    </AuthGuard>
  );
}

const taskSearchSchema = z.object({
  page: z.coerce.number().optional().catch(1),
  pageSize: z.coerce.number().optional().catch(10),
  status: z
    .array(z.enum(statuses.map((status) => status.value)))
    .optional()
    .catch([]),
  priority: z
    .array(z.enum(priorities.map((priority) => priority.value)))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/dashboard/tasks/")({
  validateSearch: taskSearchSchema,
  component: TasksWithGuard,
});