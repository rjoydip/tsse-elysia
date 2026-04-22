/**
 * Notification settings API endpoints.
 * Provides GET and PUT operations for user notification preferences.
 */

import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth";
import { db, schema } from "~/lib/db";
import { createError } from "evlog";
import { nanoid } from "nanoid";
import { settingsLogger } from "~/lib/logger";

/**
 * Notification data schema for OpenAPI documentation.
 */
const notificationsExample = {
  type: "all",
  mobile: false,
  communication_emails: false,
  social_emails: true,
  marketing_emails: false,
  security_emails: true,
};

/**
 * Notification settings route group.
 * Mounted under `/api/settings/notifications`.
 */
export const notificationSettingsRoutes = new Elysia({
  name: "api.routes.settings.notifications",
  prefix: "/settings/notifications",
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
          fix: "Sign in to access your notification settings",
        });
      }

      const userId = session.user.id;

      const [notifications] = await db
        .select()
        .from(schema.userSettingsNotifications)
        .where(eq(schema.userSettingsNotifications.userId, userId))
        .limit(1);

      if (!notifications) {
        return {
          type: "all",
          mobile: false,
          communication_emails: false,
          social_emails: true,
          marketing_emails: false,
          security_emails: true,
        };
      }

      return {
        type: notifications.type,
        mobile: notifications.mobile,
        communication_emails: notifications.communicationEmails,
        social_emails: notifications.socialEmails,
        marketing_emails: notifications.marketingEmails,
        security_emails: notifications.securityEmails,
      };
    },
    {
      detail: {
        summary: "Get notification settings",
        description:
          "Returns the current user's notification preferences including email and mobile settings.",
        tags: ["settings"],
        responses: {
          200: {
            description: "Notification settings retrieved successfully",
            content: { "application/json": { example: notificationsExample } },
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
          fix: "Sign in to update your notification settings",
        });
      }

      const userId = session.user.id;
      const {
        type,
        mobile,
        communication_emails,
        social_emails,
        marketing_emails,
        security_emails,
      } = body as {
        type: "all" | "mentions" | "none";
        mobile: boolean;
        communication_emails: boolean;
        social_emails: boolean;
        marketing_emails: boolean;
        security_emails: boolean;
      };

      const existing = await db
        .select()
        .from(schema.userSettingsNotifications)
        .where(eq(schema.userSettingsNotifications.userId, userId))
        .limit(1);

      const now = new Date();

      if (existing.length > 0) {
        await db
          .update(schema.userSettingsNotifications)
          .set({
            type,
            mobile,
            communicationEmails: communication_emails,
            socialEmails: social_emails,
            marketingEmails: marketing_emails,
            securityEmails: security_emails,
            updatedAt: now,
          })
          .where(eq(schema.userSettingsNotifications.userId, userId));

        settingsLogger.debug("Notifications updated", { userId });
      } else {
        await db.insert(schema.userSettingsNotifications).values({
          id: nanoid(),
          userId,
          type,
          mobile,
          communicationEmails: communication_emails,
          socialEmails: social_emails,
          marketingEmails: marketing_emails,
          securityEmails: security_emails,
          createdAt: now,
          updatedAt: now,
        });

        settingsLogger.debug("Notifications created", { userId });
      }

      return {
        type,
        mobile,
        communication_emails,
        social_emails,
        marketing_emails,
        security_emails,
      };
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("all"), t.Literal("mentions"), t.Literal("none")]),
        mobile: t.Boolean(),
        communication_emails: t.Boolean(),
        social_emails: t.Boolean(),
        marketing_emails: t.Boolean(),
        security_emails: t.Boolean(),
      }),
      detail: {
        summary: "Update notification settings",
        description:
          "Updates the current user's notification preferences including email and mobile settings.",
        tags: ["settings"],
        responses: {
          200: {
            description: "Notification settings updated successfully",
            content: { "application/json": { example: notificationsExample } },
          },
          401: { description: "Unauthorized - no active session" },
          400: { description: "Invalid request body" },
        },
      },
    },
  );