/**
 * Account settings API endpoints.
 * Uses controller for session validation, service for business logic.
 */

import { Elysia, t } from "elysia";
import { accountService } from "~/services/dashboard/settings";
import { validateSession } from "~/controllers/settings/controller";

const accountExample = {
  name: "John Doe",
  dob: null,
  language: "en",
};

export const accountSettingsRoutes = new Elysia({
  name: "api.routes.settings.account",
  prefix: "/settings/account",
})
  .get(
    "/",
    async ({ set, request }) => {
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      const data = await accountService.getAccount(session!.userId);
      return data;
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
      const { error, session } = await validateSession(request, set);
      if (error) return error;

      const { name, dob, language } = body as {
        name: string;
        dob: string | null;
        language: string;
      };

      const data = await accountService.updateAccount(session!.userId, {
        name,
        dob,
        language,
      });
      return data;
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