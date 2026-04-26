/**
 * User Preferences Store
 * Centralized state management for user preferences using TanStack Store.
 * Includes localStorage persistence for preference retention across sessions.
 */

import { createStore, useStore } from "@tanstack/react-store";
import { isBrowser } from "~/config";
import { logger } from "~/lib/logger";

/**
 * User preferences interface defining all configurable settings.
 */
interface UserPreferences {
  emailNotifications: boolean;
  marketingEmails: boolean;
  sessionAlerts: boolean;
  profileVisibility: boolean;
  activityStatus: boolean;
}

/**
 * Default preferences configuration.
 */
export const defaultPreferences: UserPreferences = {
  emailNotifications: true,
  marketingEmails: false,
  sessionAlerts: true,
  profileVisibility: true,
  activityStatus: true,
};

/**
 * Storage key for persisting preferences in localStorage.
 */
const STORAGE_KEY = "user-preferences";

/**
 * Load preferences from localStorage.
 * Falls back to defaults if no stored preferences exist.
 * Validates the stored data structure to prevent runtime errors.
 */
export function loadPreferences(): UserPreferences {
  // If we're not in a browser environment, return defaults
  if (!isBrowser) {
    return defaultPreferences;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that parsed data matches expected structure
      if (parsed && typeof parsed === "object") {
        const validatedPrefs: Partial<UserPreferences> = {};
        // Only accept known boolean properties
        if (typeof parsed.emailNotifications === "boolean") {
          validatedPrefs.emailNotifications = parsed.emailNotifications;
        }
        if (typeof parsed.marketingEmails === "boolean") {
          validatedPrefs.marketingEmails = parsed.marketingEmails;
        }
        if (typeof parsed.sessionAlerts === "boolean") {
          validatedPrefs.sessionAlerts = parsed.sessionAlerts;
        }
        if (typeof parsed.profileVisibility === "boolean") {
          validatedPrefs.profileVisibility = parsed.profileVisibility;
        }
        if (typeof parsed.activityStatus === "boolean") {
          validatedPrefs.activityStatus = parsed.activityStatus;
        }
        return { ...defaultPreferences, ...validatedPrefs };
      }
    }
  } catch (error) {
    logger.error(`Failed to load preferences from storage`, error as Error);
  }
  return defaultPreferences;
}

/**
 * Save preferences to localStorage.
 * Persists the current preferences state for session retention.
 */
export function savePreferences(preferences: UserPreferences): void {
  // If we're not in a browser environment, skip saving
  if (!isBrowser) {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    logger.error(`Failed to save preferences to storage`, error as Error);
  }
}

/**
 * User preferences store using TanStack Store.
 * Provides reactive state management with localStorage persistence.
 * Pass an object to get a mutable Store with setState.
 */
export const preferencesStore = createStore({
  ...loadPreferences(),
});

/**
 * Hook to access preferences from the store.
 * Only re-renders when the preferences object changes.
 *
 * @example
 * const preferences = usePreferences();
 */
export function usePreferences(): UserPreferences {
  return useStore(preferencesStore, (state) => state);
}

/**
 * Update preferences with automatic persistence.
 * Merges new values with existing preferences and saves to storage.
 *
 * @example
 * setPreferences({ emailNotifications: false });
 */
export function setPreferences(updates: Partial<UserPreferences>): void {
  preferencesStore.setState((prev) => {
    const newPreferences = { ...prev, ...updates };
    return newPreferences;
  });
  // Save to localStorage after state update to avoid interfering with TanStack store batching
  savePreferences(preferencesStore.state);
}

/**
 * Reset preferences to default values.
 * Clears stored preferences and restores defaults.
 *
 * @example
 * resetPreferences();
 */
export function resetPreferences(): void {
  preferencesStore.setState(() => defaultPreferences);
  // Save to localStorage after state update to avoid interfering with TanStack store batching
  savePreferences(defaultPreferences);
}