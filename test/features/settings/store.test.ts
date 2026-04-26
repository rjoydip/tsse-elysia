import { describe, it, expect, beforeEach, afterEach, vi } from "bun:test";
import { settingsStore, settingsActions, initSettings } from "~/store/settings";

describe("Settings Store", () => {
  beforeEach(() => {
    settingsStore.setState(() => ({
      profile: null,
      account: null,
      display: null,
      notifications: null,
      loading: false,
      error: null,
    }));

    global.fetch = vi.fn((input) => {
      const url = typeof input === "string" ? input : (input as Request).url;

      if (url.includes("/api/settings/profile")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            username: "Final User",
            email: "final@test.com",
            bio: "Final bio",
            urls: [],
          }),
        } as Response);
      }

      if (url.includes("/api/settings/account")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            name: "Final Name",
            dob: "1990-01-01T00:00:00.000Z",
            language: "de",
          }),
        } as Response);
      }

      if (url.includes("/api/settings/display")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: ["downloads", "applications"],
          }),
        } as Response);
      }

      if (url.includes("/api/settings/notifications")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            type: "none",
            mobile: false,
            communication_emails: true,
            social_emails: true,
            marketing_emails: true,
            security_emails: true,
          }),
        } as Response);
      }

      return Promise.reject(new Error("Unknown URL"));
    }) as unknown as typeof fetch;
    (global.fetch as any).preconnect = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initSettings", () => {
    it("should initialize settings from user data", () => {
      initSettings({ name: "Test User", email: "test@example.com" });

      const state = settingsStore.get();
      expect(state.profile).toEqual({
        username: "Test User",
        email: "test@example.com",
        bio: "",
        urls: [],
      });
      expect(state.account).toEqual({
        name: "Test User",
        dob: null,
        language: "en",
      });
      expect(state.display).toEqual({ items: ["recents", "home"] });
      expect(state.notifications).toEqual({
        type: "all",
        mobile: false,
        communication_emails: false,
        marketing_emails: false,
        social_emails: true,
        security_emails: true,
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should handle null user", () => {
      initSettings(null);

      const state = settingsStore.get();
      expect(state.profile).toBeNull();
    });
  });

  describe("settingsActions", () => {
    it("setLoading should update loading state", () => {
      settingsActions.setLoading(true);

      const state = settingsStore.get();
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("clearError should clear error state", () => {
      settingsStore.setState((s) => ({ ...s, error: "Some error" }));
      settingsActions.clearError();

      const state = settingsStore.get();
      expect(state.error).toBeNull();
    });

    it("updateProfile should update profile data", () => {
      initSettings({ name: "Test", email: "test@test.com" });

      settingsActions.updateProfile({
        username: "Updated User",
        email: "updated@test.com",
        bio: "New bio",
        urls: [{ value: "https://example.com" }],
      });

      const state = settingsStore.get();
      expect(state.profile?.username).toBe("Updated User");
      expect(state.profile?.bio).toBe("New bio");
    });

    it("updateAccount should update account data", () => {
      initSettings({ name: "Test", email: "test@test.com" });

      settingsActions.updateAccount({
        name: "Account Name",
        dob: new Date("1990-01-01"),
        language: "fr",
      });

      const state = settingsStore.get();
      expect(state.account?.name).toBe("Account Name");
      expect(state.account?.language).toBe("fr");
    });

    it("updateDisplay should update display data", () => {
      initSettings({ name: "Test", email: "test@test.com" });

      settingsActions.updateDisplay({
        items: ["home", "documents"],
      });

      const state = settingsStore.get();
      expect(state.display?.items).toEqual(["home", "documents"]);
    });

    it("updateNotifications should update notifications data", () => {
      initSettings({ name: "Test", email: "test@test.com" });

      settingsActions.updateNotifications({
        type: "mentions",
        mobile: true,
        communication_emails: true,
        social_emails: false,
        marketing_emails: false,
        security_emails: true,
      });

      const state = settingsStore.get();
      expect(state.notifications?.type).toBe("mentions");
      expect(state.notifications?.mobile).toBe(true);
    });

    it("submitProfile should simulate API call", async () => {
      initSettings({ name: "Test", email: "test@test.com" });

      await settingsActions.submitProfile({
        username: "Final User",
        email: "final@test.com",
        bio: "Final bio",
        urls: [],
      });

      const state = settingsStore.get();
      expect(state.profile?.username).toBe("Final User");
      expect(state.loading).toBe(false);
    });

    it("submitAccount should simulate API call", async () => {
      initSettings({ name: "Test", email: "test@test.com" });

      await settingsActions.submitAccount({
        name: "Final Name",
        dob: new Date("1990-01-01"),
        language: "de",
      });

      const state = settingsStore.get();
      expect(state.account?.name).toBe("Final Name");
      expect(state.loading).toBe(false);
    });

    it("submitDisplay should simulate API call", async () => {
      initSettings({ name: "Test", email: "test@test.com" });

      await settingsActions.submitDisplay({
        items: ["downloads", "applications"],
      });

      const state = settingsStore.get();
      expect(state.display?.items).toEqual(["downloads", "applications"]);
      expect(state.loading).toBe(false);
    });

    it("submitNotifications should simulate API call", async () => {
      initSettings({ name: "Test", email: "test@test.com" });

      await settingsActions.submitNotifications({
        type: "none",
        mobile: false,
        communication_emails: true,
        social_emails: true,
        marketing_emails: true,
        security_emails: true,
      });

      const state = settingsStore.get();
      expect(state.notifications?.type).toBe("none");
      expect(state.loading).toBe(false);
    });

    it("resetAll should reset to initial state", () => {
      initSettings({ name: "Test", email: "test@test.com" });
      settingsActions.updateProfile({
        username: "Test",
        email: "test@test.com",
        bio: "Modified bio",
        urls: [],
      });

      settingsActions.resetAll();

      const state = settingsStore.get();
      expect(state.profile).toBeNull();
      expect(state.account).toBeNull();
    });
  });
});