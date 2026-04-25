/**
 * Settings routes aggregator.
 * Combines all settings-related API routes under `/api/settings`.
 */

import { Elysia } from "elysia";
import { profileSettingsRoutes } from "./-profile";
import { accountSettingsRoutes } from "./-account";
import { displaySettingsRoutes } from "./-display";
import { notificationSettingsRoutes } from "./-notifications";

/**
 * Combined settings route group.
 * Mounts profile, account, display, and notification routes under `/api/settings`.
 */
export const settingsRoutes = new Elysia({ name: "api.routes.settings" })
  .use(profileSettingsRoutes)
  .use(accountSettingsRoutes)
  .use(displaySettingsRoutes)
  .use(notificationSettingsRoutes);