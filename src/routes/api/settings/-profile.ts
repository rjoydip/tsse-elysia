/**
 * Profile settings API endpoints.
 * Delegates to the profile service for business logic.
 */

import { Elysia, t } from "elysia";
import { auth } from "~/lib/auth";
import { getProfile, updateProfile } from "~/services/settings";

const profileExample = {
  username: "johndoe",
  email: "john@example.com",
  bio: "Software developer",
  urls: [{ value: "https://github.com/johndoe" }],
};

export const profileSettingsRoutes = new Elysia({
  name: "api.routes.settings.profile",
  prefix: "/settings/profile",
})
  .get(
    "/",
    async ({ set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const data = await getProfile(session.user.id);
      return data;
    },
    {
      detail: {
        summary: "Get profile settings",
        description:
          "Returns the current user's profile settings including username, bio, and social URLs.",
        tags: ["settings"],
        responses: {
          200: {
            description: "Profile settings retrieved successfully",
            content: { "application/json": { example: profileExample } },
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

      const { username, bio, urls } = body as {
        username: string;
        bio: string;
        urls: Array<{ value: string }>;
      };

      const data = await updateProfile(session.user.id, { username, bio, urls });
      return { ...data, email: session.user.email };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
        bio: t.Optional(t.String()),
        urls: t.Optional(t.Array(t.Object({ value: t.String({ format: "uri" }) }))),
      }),
      detail: {
        summary: "Update profile settings",
        description:
          "Updates the current user's profile settings including username, bio, and social URLs.",
        tags: ["settings"],
        responses: {
          200: {
            description: "Profile settings updated successfully",
            content: { "application/json": { example: profileExample } },
          },
          401: { description: "Unauthorized - no active session" },
          400: { description: "Invalid request body" },
        },
      },
    },
  );