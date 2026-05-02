/**
 * Unit tests for notifications repository with Result types.
 * Uses inline mocking to avoid database dependencies.
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { Result } from "~/lib/result";
import { NotificationsRepository } from "~/repositories/settings/notifications.repository";
import { NotFoundError } from "~/lib/result";

describe("Notifications Repository (Result Types)", () => {
  let repository: NotificationsRepository;
  let mockDb: any;

  beforeEach(() => {
    // Create mock database that returns empty results by default
    mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
      insert: () => ({
        values: () => Promise.resolve([]),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve([]),
        }),
      }),
    };

    repository = new NotificationsRepository(mockDb);
  });

  describe("findNotificationsByUserId", () => {
    test("should return Result.err with NotFoundError when not found", async () => {
      const result = await repository.findNotificationsByUserId("non-existent-user");

      expect(Result.isError(result)).toBe(true);
      if (Result.isError(result)) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error._tag).toBe("NotFoundError");
      }
    });

    test("should return Result.ok with notification settings when found", async () => {
      const mockNotifications = {
        id: "notifications-1",
        userId: "test-user-id",
        type: "all",
        mobile: false,
        communicationEmails: false,
        socialEmails: true,
        marketingEmails: false,
        securityEmails: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Override mock to return data
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockNotifications]),
          }),
        }),
      });

      const result = await repository.findNotificationsByUserId("test-user-id");

      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.userId).toBe("test-user-id");
      }
    });
  });

  describe("createNotifications", () => {
    test("should return ok(void) on success", async () => {
      const result = await repository.createNotifications({
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

      expect(Result.isOk(result)).toBe(true);
    });
  });

  describe("updateNotifications", () => {
    test("should return Result.err with NotFoundError when notifications not found", async () => {
      // Mock findNotificationsByUserId to return NotFoundError (empty result)
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const result = await repository.updateNotifications("non-existent-user", {
        type: "mentions",
        mobile: true,
        communicationEmails: true,
        socialEmails: false,
        marketingEmails: false,
        securityEmails: true,
        updatedAt: new Date(),
      });

      expect(Result.isError(result)).toBe(true);
      if (Result.isError(result)) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    test("should return ok(void) on success", async () => {
      // Mock findNotificationsByUserId to return success
      const mockNotifications = {
        id: "notifications-1",
        userId: "test-user",
        type: "all",
        mobile: false,
        communicationEmails: false,
        socialEmails: true,
        marketingEmails: false,
        securityEmails: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockNotifications]),
          }),
        }),
      });

      const result = await repository.updateNotifications("test-user", {
        type: "mentions",
        mobile: true,
        communicationEmails: true,
        socialEmails: false,
        marketingEmails: false,
        securityEmails: true,
        updatedAt: new Date(),
      });

      expect(Result.isOk(result)).toBe(true);
    });
  });
});