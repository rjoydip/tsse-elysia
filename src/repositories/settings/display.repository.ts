/**
 * Display settings repository.
 * Handles all ORM (Drizzle) operations for user display settings.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "~/config/db";
import { nanoid } from "nanoid";

/**
 * Repository interface for display settings database operations.
 */
export interface IDisplayRepository {
  findDisplayByUserId(
    userId: string,
  ): Promise<typeof schema.userSettingsDisplay.$inferSelect | undefined>;
  createDisplay(data: {
    userId: string;
    items: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<void>;
  updateDisplay(
    userId: string,
    data: {
      items: string;
      updatedAt: Date;
    },
  ): Promise<void>;
}

/**
 * Display settings repository implementation using Drizzle ORM.
 */
export class DisplayRepository implements IDisplayRepository {
  /**
   * Finds display settings by user ID.
   */
  async findDisplayByUserId(
    userId: string,
  ): Promise<typeof schema.userSettingsDisplay.$inferSelect | undefined> {
    const [display] = await db
      .select()
      .from(schema.userSettingsDisplay)
      .where(eq(schema.userSettingsDisplay.userId, userId))
      .limit(1);
    return display;
  }

  /**
   * Creates new display settings.
   */
  async createDisplay(data: {
    userId: string;
    items: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<void> {
    await db.insert(schema.userSettingsDisplay).values({
      id: nanoid(),
      userId: data.userId,
      items: data.items,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Updates existing display settings.
   */
  async updateDisplay(
    userId: string,
    data: {
      items: string;
      updatedAt: Date;
    },
  ): Promise<void> {
    await db
      .update(schema.userSettingsDisplay)
      .set({
        items: data.items,
        updatedAt: data.updatedAt,
      })
      .where(eq(schema.userSettingsDisplay.userId, userId));
  }
}

/**
 * Singleton instance of the display repository.
 */
export const displayRepository = new DisplayRepository();