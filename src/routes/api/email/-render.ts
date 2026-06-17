import { Elysia } from "elysia";
import {
  validateRenderRequest,
  renderEmailToResponse,
} from "~/controllers/email/render.controller";

const successExample = "<!DOCTYPE html>\n<html>... rendered email HTML ...</html>";
const errorExample = {
  error: "Validation failed",
  issues: [{ field: "template", message: "Template name is required" }],
};
const notFoundExample = { error: 'Template "welcome" not found' };

/**
 * Email render API route.
 *
 * POST /api/email/render
 * Accepts a template name and data object, returns rendered HTML.
 * Body validation is handled by the controller using Zod.
 */
export const emailRenderRoutes = new Elysia({
  name: "api.routes.email.render",
  prefix: "/email",
}).post(
  "/render",
  async ({ request }) => {
    let body: unknown;

    try {
      // Use text() + JSON.parse() instead of json() to avoid issues with
      // body consumption by upstream handlers (TanStack Start HTTP layer).
      body = JSON.parse(await request.text());
    } catch (err) {
      console.error("[email/render] Body read error:", err);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = validateRenderRequest(body);

    if (!validation.valid) {
      return validation.response;
    }

    return renderEmailToResponse(validation.parsed.template, validation.parsed.data);
  },
  {
    detail: {
      tags: ["email"],
      summary: "Render an email template",
      description:
        "Renders a Maizzle email template with the provided data. " +
        "Variables are substituted using {= varName =} tokens in the pre-built template HTML.",
      requestBody: {
        content: {
          "application/json": {
            example: {
              template: "welcome",
              data: {
                username: "Jane",
                dashboardUrl: "https://example.com/dashboard",
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Rendered email HTML",
          content: { "text/html": { example: successExample } },
        },
        400: {
          description: "Validation error",
          content: { "application/json": { example: errorExample } },
        },
        404: {
          description: "Template not found",
          content: { "application/json": { example: notFoundExample } },
        },
      },
    },
  },
);