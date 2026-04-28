/**
 * Display settings API endpoints.
 * Uses controller for session validation, service for business logic.
 */

import { Elysia, t } from "elysia";
import { displayService } from "~/services/dashboard/settings";
import { validateSession } from "~/controllers/settings/controller";

const displayExample = {
  items: ["recents", "home"],
};

export const displaySettingsRoutes = new Elysia({
  name: "api.routes.settings.display",
  prefix: "/settings/display",
})
  .get(
    "/",
    async ({ set, request }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      const data = await displayService.getDisplay(session!.userId);
      return data;
    },
    {
      detail: {
        summary: "Get display settings",
        description: "Returns the current user's display preferences including sidebar items.",
        tags: ["settings"],
        responses: {
          200: {
            description: "Display settings retrieved successfully",
            content: { "application/json": { example: displayExample } },
          },
          401: { description: "Unauthorized - no active session" },
        },
      },
    },
  )
  .put(
    "/",
    async ({ body, set, request }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      const { items } = body as { items: string[] };
      const data = await displayService.updateDisplay(session!.userId, { items });
      return data;
    },
    {
      body: t.Object({
        items: t.Array(t.String()),
      }),
      detail: {
        summary: "Update display settings",
        description: "Updates the current user's display preferences including sidebar items.",
        tags: ["settings"],
        responses: {
          200: {
            description: "Display settings updated successfully",
            content: { "application/json": { example: displayExample } },
          },
          401: { description: "Unauthorized - no active session" },
          400: { description: "Invalid request body" },
        },
      },
    },
  );