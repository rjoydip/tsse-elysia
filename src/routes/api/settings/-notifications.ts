/**
 * Notification settings API endpoints.
 * Uses controller for session validation, service for business logic.
 */

import { Elysia, t } from "elysia";
import { notificationsService } from "~/services/dashboard/settings";
import { validateSession } from "~/controllers/settings/controller";

const notificationsExample = {
  type: "all",
  mobile: false,
  communication_emails: false,
  social_emails: true,
  marketing_emails: false,
  security_emails: true,
};

export const notificationSettingsRoutes = new Elysia({
  name: "api.routes.settings.notifications",
  prefix: "/settings/notifications",
})
  .get(
    "/",
    async ({ set, request }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      const data = await notificationsService.getNotifications(session!.userId);
      return data;
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
      const { error, session } = await validateSession(request, set);
      if (error) return error;

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

      const data = await notificationsService.updateNotifications(session!.userId, {
        type,
        mobile,
        communication_emails,
        social_emails,
        marketing_emails,
        security_emails,
      });
      return data;
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