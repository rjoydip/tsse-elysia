/**
 * Profile settings service.
 * Encapsulates profile CRUD operations.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "~/config/db";
import { nanoid } from "nanoid";
import { settingsLogger } from "~/lib/logger";

export interface ProfileResponse {
  username: string;
  email: string;
  bio: string;
  urls: Array<{ value: string }>;
}

export interface UpdateProfileInput {
  username: string;
  bio?: string;
  urls?: Array<{ value: string }>;
}

export async function getProfile(userId: string): Promise<ProfileResponse> {
  const [profile] = await db
    .select()
    .from(schema.userSettingsProfile)
    .where(eq(schema.userSettingsProfile.userId, userId))
    .limit(1);

  if (!profile) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

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
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<ProfileResponse> {
  const { username, bio, urls } = input;
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

  const [updated] = await db
    .select()
    .from(schema.userSettingsProfile)
    .where(eq(schema.userSettingsProfile.userId, userId))
    .limit(1);

  return {
    username: updated.username,
    email: updated.email,
    bio: updated.bio,
    urls: JSON.parse(updated.urls || "[]"),
  };
}