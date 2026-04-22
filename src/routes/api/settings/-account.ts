/**
 * Account settings API endpoints.
 * Provides GET and PUT operations for user account data (name, dob, language).
 */

import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth";
import { db, schema } from "~/lib/db";
import { createError } from "evlog";
import { nanoid } from "nanoid";
import { settingsLogger } from "~/lib/logger";

/**
 * Account data schema for OpenAPI documentation.
 */
const accountExample = {
  name: "John Doe",
  dob: null,
  language: "en",
};

/**
 * Account settings route group.
 * Mounted under `/api/settings/account`.
 */
export const accountSettingsRoutes = new Elysia({
  name: "api.routes.settings.account",
  prefix: "/settings/account",
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
          fix: "Sign in to access your account settings",
        });
      }

      const userId = session.user.id;

      const [account] = await db
        .select()
        .from(schema.userSettingsAccount)
        .where(eq(schema.userSettingsAccount.userId, userId))
        .limit(1);

      if (!account) {
        const [user] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, userId))
          .limit(1);

        return {
          name: user?.name || "",
          dob: null,
          language: "en",
        };
      }

      return {
        name: account.name,
        dob: account.dob ? new Date(account.dob).toISOString() : null,
        language: account.language,
      };
    },
    {
      detail: {
        summary: "Get account settings",
        description:
          "Returns the current user's account settings including name, date of birth, and language preference.",
        tags: ["settings"],
        responses: {
          200: {
            description: "Account settings retrieved successfully",
            content: { "application/json": { example: accountExample } },
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
          fix: "Sign in to update your account settings",
        });
      }

      const userId = session.user.id;
      const { name, dob, language } = body as {
        name: string;
        dob: string | null;
        language: string;
      };

      const existing = await db
        .select()
        .from(schema.userSettingsAccount)
        .where(eq(schema.userSettingsAccount.userId, userId))
        .limit(1);

      const now = new Date();

      if (existing.length > 0) {
        await db
          .update(schema.userSettingsAccount)
          .set({
            name: name || "",
            dob: dob ? new Date(dob) : null,
            language: language || "en",
            updatedAt: now,
          })
          .where(eq(schema.userSettingsAccount.userId, userId));

        settingsLogger.debug("Account updated", { userId });
      } else {
        await db.insert(schema.userSettingsAccount).values({
          id: nanoid(),
          userId,
          name: name || "",
          dob: dob ? new Date(dob) : null,
          language: language || "en",
          createdAt: now,
          updatedAt: now,
        });

        settingsLogger.debug("Account created", { userId });
      }

      return {
        name: name || "",
        dob: dob,
        language: language || "en",
      };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        dob: t.Optional(t.String({ format: "date-time" })),
        language: t.Optional(t.String()),
      }),
      detail: {
        summary: "Update account settings",
        description:
          "Updates the current user's account settings including name, date of birth, and language preference.",
        tags: ["settings"],
        responses: {
          200: {
            description: "Account settings updated successfully",
            content: { "application/json": { example: accountExample } },
          },
          401: { description: "Unauthorized - no active session" },
          400: { description: "Invalid request body" },
        },
      },
    },
  );