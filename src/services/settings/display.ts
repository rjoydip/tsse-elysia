/**
 * Display settings service.
 * Encapsulates display preferences CRUD operations.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "~/config/db";
import { nanoid } from "nanoid";
import { settingsLogger } from "~/lib/logger";

export interface DisplayResponse {
  items: string[];
}

export interface UpdateDisplayInput {
  items: string[];
}

export async function getDisplay(userId: string): Promise<DisplayResponse> {
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
}

export async function updateDisplay(
  userId: string,
  input: UpdateDisplayInput,
): Promise<DisplayResponse> {
  const { items } = input;
  const existing = await db
    .select()
    .from(schema.userSettingsDisplay)
    .where(eq(schema.userSettingsDisplay.userId, userId))
    .limit(1);

  const now = new Date();
  const itemsJson = JSON.stringify(items || ["recents", "home"]);

  if (existing.length > 0) {
    await db
      .update(schema.userSettingsDisplay)
      .set({
        items: itemsJson,
        updatedAt: now,
      })
      .where(eq(schema.userSettingsDisplay.userId, userId));

    settingsLogger.debug("Display updated", { userId });
  } else {
    await db.insert(schema.userSettingsDisplay).values({
      id: nanoid(),
      userId,
      items: itemsJson,
      createdAt: now,
      updatedAt: now,
    });

    settingsLogger.debug("Display created", { userId });
  }

  return {
    items: items || ["recents", "home"],
  };
}