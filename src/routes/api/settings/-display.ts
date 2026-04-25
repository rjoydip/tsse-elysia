/**
 * Display settings API endpoints.
 * Provides GET and PUT operations for user display preferences (sidebar items).
 */

import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth";
import { db, schema } from "~/lib/db";
import { createError } from "evlog";
import { nanoid } from "nanoid";
import { settingsLogger } from "~/lib/logger";

/**
 * Display data schema for OpenAPI documentation.
 */
const displayExample = {
  items: ["recents", "home"],
};

/**
 * Display settings route group.
 * Mounted under `/api/settings/display`.
 */
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
        return createError({
          message: "Unauthorized",
          status: 401,
          why: "No active session found",
          fix: "Sign in to access your display settings",
        });
      }

      const userId = session.user.id;

      const [display] = await db
        .select()
        .from(schema.userSettingsDisplay)
        .where(eq(schema.userSettingsDisplay.userId, userId))
        .limit(1);

      if (!display) {
        return {
          items: ["recents", "home"],
        };
      }

      return {
        items: JSON.parse(display.items || '["recents","home"]'),
      };
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
        return createError({
          message: "Unauthorized",
          status: 401,
          why: "No active session found",
          fix: "Sign in to update your display settings",
        });
      }

      const userId = session.user.id;
      const { items } = body as { items: string[] };

      const existing = await db
        .select()
        .from(schema.userSettingsDisplay)
        .where(eq(schema.userSettingsDisplay.userId, userId))
        .limit(1);

      const now = new Date();

      if (existing.length > 0) {
        await db
          .update(schema.userSettingsDisplay)
          .set({
            items: JSON.stringify(items || ["recents", "home"]),
            updatedAt: now,
          })
          .where(eq(schema.userSettingsDisplay.userId, userId));

        settingsLogger.debug("Display updated", { userId });
      } else {
        await db.insert(schema.userSettingsDisplay).values({
          id: nanoid(),
          userId,
          items: JSON.stringify(items || ["recents", "home"]),
          createdAt: now,
          updatedAt: now,
        });

        settingsLogger.debug("Display created", { userId });
      }

      return {
        items: items || ["recents", "home"],
      };
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