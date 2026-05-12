/**
 * Unified settings state management using TanStack Store.
 * Manages all user settings across Profile, Account, Display, and Notifications.
 * Provides reactive state for React components and handles CRUD operations.
 *
 * @module stores/settings
 */

import { createStore, useSelector } from "@tanstack/react-store";
import { settingsLogger } from "~/lib/logger";

/**
 * Profile data structure containing user profile information.
 * Email is optional for API submissions (managed via auth).
 */
interface ProfileData {
  username: string;
  email?: string;
  bio: string;
  urls: Array<{ value: string }>;
}

/**
 * Account data structure containing user account settings.
 */
export interface AccountData {
  name: string;
  dob: Date | null;
  language: string;
}

/**
 * Display data structure containing sidebar display preferences.
 */
interface DisplayData {
  items: string[];
}

/**
 * Notification data structure containing user notification preferences.
 */
export interface NotificationData {
  type: "all" | "mentions" | "none";
  mobile: boolean;
  communication_emails: boolean;
  social_emails: boolean;
  marketing_emails: boolean;
  security_emails: boolean;
}

/**
 * Combined settings state interface.
 */
interface SettingsState {
  profile: ProfileData | null;
  account: AccountData | null;
  display: DisplayData | null;
  notifications: NotificationData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Initial default values for notification settings.
 */
const defaultNotifications: NotificationData = {
  type: "all",
  mobile: false,
  communication_emails: false,
  marketing_emails: false,
  social_emails: true,
  security_emails: true,
};

/**
 * Initial default values for display settings.
 */
const defaultDisplay: DisplayData = {
  items: ["recents", "home"],
};

/**
 * Initial settings state with defaults.
 */
const initialState: SettingsState = {
  profile: null,
  account: null,
  display: null,
  notifications: null,
  loading: false,
  error: null,
};

/**
 * TanStack Store for settings data.
 */
export const settingsStore = createStore<SettingsState>(initialState);

/**
 * Initialize settings with user data from session.
 * @param user - The user object from session
 */
export function initSettings(user: { name?: string; email?: string } | null | undefined) {
  if (!user) return;

  settingsStore.setState(() => ({
    profile: {
      username: user.name || "",
      email: user.email || "",
      bio: "",
      urls: [],
    },
    account: {
      name: user.name || "",
      dob: null,
      language: "en",
    },
    display: defaultDisplay,
    notifications: defaultNotifications,
    loading: false,
    error: null,
  }));
}

/**
 * Generic API fetch helper.
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Settings store actions for CRUD operations.
 */
export const settingsActions = {
  /**
   * Initialize all settings from user session.
   * @param user - The user object from session
   */
  initAll: (user: { name?: string; email?: string } | null | undefined) => {
    initSettings(user);
  },

  /**
   * Set loading state.
   * @param isLoading - Whether settings are loading
   */
  setLoading: (isLoading: boolean) => {
    settingsStore.setState((state) => ({
      ...state,
      loading: isLoading,
      error: null,
    }));
  },

  /**
   * Clear error state.
   */
  clearError: () => {
    settingsStore.setState((state) => ({ ...state, error: null }));
  },

  /**
   * Update profile data.
   * @param data - Profile data to update
   */
  updateProfile: (data: ProfileData) => {
    settingsStore.setState((state) => ({
      ...state,
      profile: { ...state.profile, ...data } as ProfileData,
    }));
  },

  /**
   * Update account data.
   * @param data - Account data to update
   */
  updateAccount: (data: AccountData) => {
    settingsStore.setState((state) => ({
      ...state,
      account: { ...state.account, ...data } as AccountData,
    }));
  },

  /**
   * Update display data.
   * @param data - Display data to update
   */
  updateDisplay: (data: DisplayData) => {
    settingsStore.setState((state) => ({
      ...state,
      display: { ...state.display, ...data } as DisplayData,
    }));
  },

  /**
   * Update notifications data.
   * @param data - Notification data to update
   */
  updateNotifications: (data: NotificationData) => {
    settingsStore.setState((state) => ({
      ...state,
      notifications: { ...state.notifications, ...data } as NotificationData,
    }));
  },

  /**
   * Fetch all settings from API.
   * @returns Promise that resolves when all settings are fetched
   */
  fetchAll: async () => {
    settingsStore.setState((state) => ({
      ...state,
      loading: true,
      error: null,
    }));

    try {
      const [profile, account, display, notifications] = await Promise.allSettled([
        apiFetch<ProfileData>("/api/settings/profile"),
        apiFetch<AccountData>("/api/settings/account"),
        apiFetch<DisplayData>("/api/settings/display"),
        apiFetch<NotificationData>("/api/settings/notifications"),
      ]);

      settingsStore.setState(() => ({
        profile: profile.status === "fulfilled" ? profile.value : null,
        account:
          account.status === "fulfilled"
            ? {
                name: account.value.name,
                dob: account.value.dob ? new Date(account.value.dob) : null,
                language: account.value.language,
              }
            : null,
        display: display.status === "fulfilled" ? display.value : defaultDisplay,
        notifications:
          notifications.status === "fulfilled" ? notifications.value : defaultNotifications,
        loading: false,
        error: null,
      }));
    } catch (error) {
      settingsLogger.error("Failed to fetch settings", error as Error);
      settingsStore.setState((state) => ({
        ...state,
        loading: false,
        error: "Failed to load settings",
      }));
    }
  },

  /**
   * Submit profile update to API.
   * @param data - Profile data to submit
   * @returns Promise that resolves when update completes
   */
  submitProfile: async (data: ProfileData) => {
    settingsStore.setState((state) => ({
      ...state,
      loading: true,
      error: null,
    }));

    try {
      const result = await apiFetch<ProfileData>("/api/settings/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      settingsStore.setState((state) => ({
        ...state,
        profile: result,
        loading: false,
        error: null,
      }));
    } catch (error) {
      settingsLogger.error("Failed to update profile", error as Error);
      settingsStore.setState((state) => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to update profile",
      }));
      throw error;
    }
  },

  /**
   * Submit account update to API.
   * @param data - Account data to submit
   * @returns Promise that resolves when update completes
   */
  submitAccount: async (data: AccountData) => {
    settingsStore.setState((state) => ({
      ...state,
      loading: true,
      error: null,
    }));

    try {
      const payload = {
        name: data.name,
        dob: data.dob ? data.dob.toISOString() : undefined,
        language: data.language,
      };

      const result = await apiFetch<{
        name: string;
        dob: string | null;
        language: string;
      }>("/api/settings/account", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      settingsStore.setState((state) => ({
        ...state,
        account: {
          name: result.name,
          dob: result.dob ? new Date(result.dob) : null,
          language: result.language,
        },
        loading: false,
        error: null,
      }));
    } catch (error) {
      settingsLogger.error("Failed to update account", error as Error);
      settingsStore.setState((state) => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to update account",
      }));
      throw error;
    }
  },

  /**
   * Submit display update to API.
   * @param data - Display data to submit
   * @returns Promise that resolves when update completes
   */
  submitDisplay: async (data: DisplayData) => {
    settingsStore.setState((state) => ({
      ...state,
      loading: true,
      error: null,
    }));

    try {
      const result = await apiFetch<DisplayData>("/api/settings/display", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      settingsStore.setState((state) => ({
        ...state,
        display: result,
        loading: false,
        error: null,
      }));
    } catch (error) {
      settingsLogger.error("Failed to update display", error as Error);
      settingsStore.setState((state) => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to update display",
      }));
      throw error;
    }
  },

  /**
   * Submit notifications update to API.
   * @param data - Notification data to submit
   * @returns Promise that resolves when update completes
   */
  submitNotifications: async (data: NotificationData) => {
    settingsStore.setState((state) => ({
      ...state,
      loading: true,
      error: null,
    }));

    try {
      const result = await apiFetch<NotificationData>("/api/settings/notifications", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      settingsStore.setState((state) => ({
        ...state,
        notifications: result,
        loading: false,
        error: null,
      }));
    } catch (error) {
      settingsLogger.error("Failed to update notifications", error as Error);
      settingsStore.setState((state) => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to update notifications",
      }));
      throw error;
    }
  },

  /**
   * Reset all settings to initial state.
   */
  resetAll: () => {
    settingsStore.setState(() => initialState);
  },
};

/**
 * Hook to use the settings store.
 * @param selector - Optional selector function to extract specific state
 * @returns Selected state or full settings state
 */
export function useSettingsStore<T = SettingsState>(selector?: (state: SettingsState) => T): T {
  return useSelector(settingsStore, selector ?? ((state: SettingsState) => state as unknown as T));
}