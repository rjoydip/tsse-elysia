/**
 * Account settings service.
 * Encapsulates account CRUD operations.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "~/config/db";
import { nanoid } from "nanoid";
import { settingsLogger } from "~/lib/logger";

export interface AccountResponse {
  name: string;
  dob: string | null;
  language: string;
}

export interface UpdateAccountInput {
  name?: string;
  dob?: string | null;
  language?: string;
}

export async function getAccount(userId: string): Promise<AccountResponse> {
  const [account] = await db
    .select()
    .from(schema.userSettingsAccount)
    .where(eq(schema.userSettingsAccount.userId, userId))
    .limit(1);

  if (!account) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

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
}

export async function updateAccount(
  userId: string,
  input: UpdateAccountInput,
): Promise<AccountResponse> {
  const { name, dob, language } = input;
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
    name: name ?? "",
    dob: dob ?? null,
    language: language || "en",
  };
}