import { z } from "zod";
import { emailRenderService } from "~/services/email";

/** Shape of the validated render request. */
export interface RenderRequest {
  template: string;
  data: Record<string, string>;
}

/**
 * Zod schema for the email render request body.
 * Validates that template name and data object are provided.
 */
export const renderEmailSchema = z.object({
  template: z
    .string()
    .min(1, "Template name is required")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Template name must only contain letters, numbers, hyphens, and underscores",
    ),
  data: z
    .record(z.string(), z.string())
    .refine((val) => Object.keys(val).length > 0, "Data must have at least one variable"),
});

/**
 * Validates the email render request body against the schema.
 *
 * @param body - Raw request body
 * @returns Validated and parsed body, or an error response
 */
export function validateRenderRequest(
  body: unknown,
): { valid: true; parsed: RenderRequest } | { valid: false; response: Response } {
  const result = renderEmailSchema.safeParse(body);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return {
      valid: false,
      response: new Response(JSON.stringify({ error: "Validation failed", issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { valid: true, parsed: result.data as unknown as RenderRequest };
}

/**
 * Renders an email template with the provided data and returns an HTTP response.
 *
 * @param template - Template name (e.g. "welcome")
 * @param data - Key-value pairs for variable substitution
 * @returns HTTP response with rendered HTML or error
 */
export function renderEmailToResponse(template: string, data: Record<string, string>): Response {
  const result = emailRenderService.render(template, data);

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(result.html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}