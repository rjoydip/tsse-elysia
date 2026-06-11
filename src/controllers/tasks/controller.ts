/**
 * Tasks controller.
 * Handles HTTP-specific logic: request parsing, response formatting.
 * Session validation is delegated to the shared auth controller.
 */

import { validateSession } from "~/controllers/shared/auth";
import type { SessionData } from "~/controllers/shared/auth";

export type { SessionData };
export { validateSession };

/**
 * Validates the create task request body.
 */
export async function validateCreateTaskRequest(body: Record<string, unknown>): Promise<{
  error?: Response;
  data?: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    label?: string;
    dueDate?: string;
    assignee?: string;
  };
}> {
  const { title, description, status, priority, label, dueDate, assignee } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return {
      error: new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return {
    data: {
      title: title.trim(),
      description: typeof description === "string" ? description : undefined,
      status: typeof status === "string" ? status : undefined,
      priority: typeof priority === "string" ? priority : undefined,
      label: typeof label === "string" ? label : undefined,
      dueDate: typeof dueDate === "string" ? dueDate : undefined,
      assignee: typeof assignee === "string" ? assignee : undefined,
    },
  };
}