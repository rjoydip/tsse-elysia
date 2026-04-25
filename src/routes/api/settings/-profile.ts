/**
 * Profile settings API endpoints.
 * Provides GET and PUT operations for user profile data (username, bio, urls).
 */

import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth";
import { db, schema } from "~/lib/db";
import { createError } from "evlog";
import { nanoid } from "nanoid";
import { settingsLogger } from "~/lib/logger";

/**
 * Profile data schema for OpenAPI documentation.
 */
const profileExample = {
  username: "johndoe",
  email: "john@example.com",
  bio: "Software developer",
  urls: [{ value: "https://github.com/johndoe" }],
};

/**
 * Profile settings route group.
 * Mounted under `/api/settings/profile`.
 */
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
        return createError({
          message: "Unauthorized",
          status: 401,
          why: "No active session found",
          fix: "Sign in to access your profile settings",
        });
      }

      const userId = session.user.id;

      const [profile] = await db
        .select()
        .from(schema.userSettingsProfile)
        .where(eq(schema.userSettingsProfile.userId, userId))
        .limit(1);

      if (!profile) {
        const [user] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, userId))
          .limit(1);

        // Create default profile if it doesn't exist
        const [createdProfile] = await db
          .insert(schema.userSettingsProfile)
          .values({
            id: nanoid(),
            userId,
            username: user?.name || "",
            email: user?.email || "",
            bio: "",
            urls: "[]",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return {
          username: createdProfile.username,
          email: createdProfile.email,
          bio: createdProfile.bio,
          urls: JSON.parse(createdProfile.urls || "[]"),
        };
      }

      return {
        username: profile.username,
        email: profile.email,
        bio: profile.bio,
        urls: JSON.parse(profile.urls || "[]"),
      };
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
        return createError({
          message: "Unauthorized",
          status: 401,
          why: "No active session found",
          fix: "Sign in to update your profile settings",
        });
      }

      const userId = session.user.id;
      const { username, bio, urls } = body as {
        username: string;
        bio: string;
        urls: Array<{ value: string }>;
      };

      const existing = await db
        .select()
        .from(schema.userSettingsProfile)
        .where(eq(schema.userSettingsProfile.userId, userId))
        .limit(1);

      const now = new Date();

      if (existing.length > 0) {
        await db
          .update(schema.userSettingsProfile)
          .set({
            username,
            bio: bio || "",
            urls: JSON.stringify(urls || []),
            updatedAt: now,
          })
          .where(eq(schema.userSettingsProfile.userId, userId));

        settingsLogger.debug("Profile updated", { userId });
      } else {
        await db.insert(schema.userSettingsProfile).values({
          id: nanoid(),
          userId,
          username,
          bio: bio || "",
          urls: JSON.stringify(urls || []),
          createdAt: now,
          updatedAt: now,
        });

        settingsLogger.debug("Profile created", { userId });
      }

      return {
        username,
        email: session.user.email,
        bio: bio || "",
        urls: urls || [],
      };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
        bio: t.Optional(t.String()),
        urls: t.Optional(t.Array(t.Object({ value: t.String() }))),
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