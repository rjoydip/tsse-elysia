/**
 * Display settings API endpoints.
 * Delegates to the display service for business logic.
 */

import { Elysia, t } from "elysia";
import { auth } from "~/lib/auth";
import { getDisplay, updateDisplay } from "~/services/settings";

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
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const data = await getDisplay(session.user.id);
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
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { items } = body as { items: string[] };
      const data = await updateDisplay(session.user.id, { items });
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