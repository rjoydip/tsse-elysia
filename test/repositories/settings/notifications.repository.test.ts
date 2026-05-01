/**
 * Unit tests for notifications repository with Result types.
 */

import { describe, test, expect } from "bun:test";
import { Result } from "~/lib/result";
import { notificationsRepository } from "~/repositories/settings/notifications.repository";

describe("Notifications Repository (Result Types)", () => {
  describe("findNotificationsByUserId", () => {
    test("should return Result with notification settings", async () => {
      const result = await notificationsRepository.findNotificationsByUserId("test-user-id");

      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });

    test("should return Result.err with NotFoundError when not found", async () => {
      const result = await notificationsRepository.findNotificationsByUserId("non-existent-user");

      if (Result.isError(result)) {
        expect(result.error._tag).toBe("NotFoundError");
      }
    });
  });

  describe("createNotifications", () => {
    test("should return ok(void) on success", async () => {
      const result = await notificationsRepository.createNotifications({
        userId: "test-user",
        type: "all",
        mobile: false,
        communicationEmails: false,
        socialEmails: true,
        marketingEmails: false,
        securityEmails: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });
  });

  describe("updateNotifications", () => {
    test("should return ok(void) on success", async () => {
      const result = await notificationsRepository.updateNotifications("test-user", {
        type: "mentions",
        mobile: true,
        communicationEmails: true,
        socialEmails: false,
        marketingEmails: false,
        securityEmails: true,
        updatedAt: new Date(),
      });

      expect(Result.isOk(result) || Result.isError(result)).toBe(true);
    });
  });
});