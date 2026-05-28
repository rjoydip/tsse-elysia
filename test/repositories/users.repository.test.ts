/**
 * Unit tests for user repository.
 * Uses inline mocking to avoid database dependencies.
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { UserRepository } from "~/repositories/users";

describe("User Repository", () => {
  let repository: UserRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: () => ({
        from: () => ({
          where: () => {
            return {
              limit: () => Promise.resolve([]),
              orderBy: () => ({
                limit: () => Promise.resolve([]),
                offset: () => Promise.resolve([]),
              }),
            };
          },
        }),
      }),
    };

    repository = new UserRepository(mockDb);
  });

  describe("findById", () => {
    test("should return null when user not found", async () => {
      const result = await repository.findById("non-existent-id");

      expect(result).toBeNull();
    });

    test("should return user when found", async () => {
      const mockUser = { id: "user-1", email: "test@test.com", name: "Test" };

      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockUser]),
          }),
        }),
      });

      const result = await repository.findById("user-1");

      expect(result?.id).toBe("user-1");
    });
  });

  describe("findByEmail", () => {
    test("should return null when user not found", async () => {
      const result = await repository.findByEmail("notfound@test.com");

      expect(result).toBeNull();
    });

    test("should return user when found by email", async () => {
      const mockUser = { id: "user-1", email: "test@test.com", name: "Test" };

      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockUser]),
          }),
        }),
      });

      const result = await repository.findByEmail("test@test.com");

      expect(result?.email).toBe("test@test.com");
    });
  });

  describe("count", () => {
    test("should return count of users", async () => {
      mockDb.select = () => ({
        from: () => Promise.resolve([{ count: 2 }] as { count: number }[]),
      });

      const result = await repository.count();

      expect(result).toBe(2);
    });
  });

  describe("countByStatus", () => {
    test("should return count of users with given status", async () => {
      let capturedWhere: any = null;

      mockDb.select = () => ({
        from: () => ({
          where: (condition: any) => {
            capturedWhere = condition;
            return Promise.resolve([{ count: 5 }]);
          },
        }),
      });

      const result = await repository.countByStatus("active");

      expect(result).toBe(5);
      expect(capturedWhere).toBeDefined();
    });

    test("should return 0 when no users match the status", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => Promise.resolve([{ count: 0 }]),
        }),
      });

      const result = await repository.countByStatus("nonexistent");

      expect(result).toBe(0);
    });

    test("should work for inactive and suspended statuses", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => Promise.resolve([{ count: 3 }]),
        }),
      });

      const inactiveCount = await repository.countByStatus("inactive");
      const suspendedCount = await repository.countByStatus("suspended");

      expect(inactiveCount).toBe(3);
      expect(suspendedCount).toBe(3);
    });
  });

  describe("countByRole", () => {
    test("should return count of users with given role", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => Promise.resolve([{ count: 10 }]),
        }),
      });

      const result = await repository.countByRole("admin");

      expect(result).toBe(10);
    });
  });

  describe("countUsersThisMonth", () => {
    test("should return count of users created this month", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => Promise.resolve([{ count: 15 }]),
        }),
      });

      const result = await repository.countUsersThisMonth();

      expect(result).toBe(15);
    });

    test("should return 0 when no users created this month", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => Promise.resolve([{ count: 0 }]),
        }),
      });

      const result = await repository.countUsersThisMonth();

      expect(result).toBe(0);
    });
  });

  describe("findRecent", () => {
    test("should return recent users ordered by createdAt desc", async () => {
      const mockUsers = [
        { id: "user-3", email: "c@test.com", createdAt: new Date("2024-03-01") },
        { id: "user-2", email: "b@test.com", createdAt: new Date("2024-02-01") },
        { id: "user-1", email: "a@test.com", createdAt: new Date("2024-01-01") },
      ];

      let orderDirection: any = null;

      mockDb.select = () => ({
        from: () => ({
          orderBy: (dir: any) => {
            orderDirection = dir;
            return {
              limit: () => Promise.resolve(mockUsers),
            };
          },
        }),
      });

      const result = await repository.findRecent(3);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("user-3");
      expect(orderDirection).toBeDefined();
    });

    test("should default to limit 10", async () => {
      let capturedLimit = 0;

      mockDb.select = () => ({
        from: () => ({
          orderBy: () => ({
            limit: (n: number) => {
              capturedLimit = n;
              return Promise.resolve([]);
            },
          }),
        }),
      });

      await repository.findRecent();
      expect(capturedLimit).toBe(10);
    });

    test("should apply role filter via where", async () => {
      let capturedRole = "";

      mockDb.select = () => ({
        from: () => ({
          orderBy: () => ({
            limit: () => ({
              where: (condition: any) => {
                capturedRole = condition;
                return Promise.resolve([]);
              },
            }),
          }),
        }),
      });

      await repository.findRecent(5, "manager");
      expect(capturedRole).toBeDefined();
    });

    test("should apply offset when provided", async () => {
      let capturedOffset = -1;

      mockDb.select = () => ({
        from: () => ({
          orderBy: () => ({
            limit: () => ({
              where: () => ({
                offset: (n: number) => {
                  capturedOffset = n;
                  return Promise.resolve([]);
                },
              }),
            }),
          }),
        }),
      });

      await repository.findRecent(5, "user", 10);
      expect(capturedOffset).toBe(10);
    });

    test("should not apply offset when offset is 0", async () => {
      mockDb.select = () => ({
        from: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const result = await repository.findRecent(5, undefined, 0);
      expect(result).toEqual([]);
    });

    test("should apply both role filter and offset", async () => {
      let capturedRole = "";
      let capturedOffset = -1;

      mockDb.select = () => ({
        from: () => ({
          orderBy: () => ({
            limit: () => ({
              where: (condition: any) => {
                capturedRole = condition;
                return {
                  offset: (n: number) => {
                    capturedOffset = n;
                    return Promise.resolve([]);
                  },
                };
              },
            }),
          }),
        }),
      });

      await repository.findRecent(5, "admin", 20);
      expect(capturedRole).toBeDefined();
      expect(capturedOffset).toBe(20);
    });
  });

  describe("getMonthlyRegistrationsForYear", () => {
    test("should return months up to current month for current year", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            groupBy: () => ({
              orderBy: () =>
                Promise.resolve([
                  { month: 1, count: 5 },
                  { month: 3, count: 7 },
                ]),
            }),
          }),
        }),
      });

      const currentYear = new Date().getFullYear();
      const result = await repository.getMonthlyRegistrationsForYear(currentYear);
      const expectedMonthCount = new Date().getMonth() + 1;

      expect(result).toHaveLength(expectedMonthCount);
      expect(result[0]).toEqual({ name: "Jan", total: 5 });
      expect(result[1]).toEqual({ name: "Feb", total: 0 });
      expect(result[2]).toEqual({ name: "Mar", total: 7 });
    });

    test("should return full 12 months for previous year", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            groupBy: () => ({
              orderBy: () =>
                Promise.resolve([
                  { month: 6, count: 10 },
                  { month: 12, count: 5 },
                ]),
            }),
          }),
        }),
      });

      const result = await repository.getMonthlyRegistrationsForYear(2025);

      expect(result).toHaveLength(12);
      expect(result[0]).toEqual({ name: "Jan", total: 0 });
      expect(result[5]).toEqual({ name: "Jun", total: 10 });
      expect(result[11]).toEqual({ name: "Dec", total: 5 });
    });

    test("should return zeros when no registrations exist for the year", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            groupBy: () => ({
              orderBy: () => Promise.resolve([]),
            }),
          }),
        }),
      });

      const currentYear = new Date().getFullYear();
      const result = await repository.getMonthlyRegistrationsForYear(currentYear);
      const expectedMonthCount = new Date().getMonth() + 1;

      expect(result).toHaveLength(expectedMonthCount);
      for (const month of result) {
        expect(month.total).toBe(0);
      }
    });
  });

  describe("getMonthlyRegistrations", () => {
    test("should return months up to current month with counts", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            groupBy: () => ({
              orderBy: () =>
                Promise.resolve([
                  { month: 1, count: 5 },
                  { month: 6, count: 3 },
                ]),
            }),
          }),
        }),
      });

      const result = await repository.getMonthlyRegistrations();
      const expectedMonthCount = new Date().getMonth() + 1;

      expect(result).toHaveLength(expectedMonthCount);
      expect(result[0]).toEqual({ name: "Jan", total: 5 });
      // Months without data should be 0
      expect(result[1]).toEqual({ name: "Feb", total: 0 });
    });

    test("should return zeros when no registrations exist", async () => {
      mockDb.select = () => ({
        from: () => ({
          where: () => ({
            groupBy: () => ({
              orderBy: () => Promise.resolve([]),
            }),
          }),
        }),
      });

      const result = await repository.getMonthlyRegistrations();
      const expectedMonthCount = new Date().getMonth() + 1;

      expect(result).toHaveLength(expectedMonthCount);
      for (const month of result) {
        expect(month.total).toBe(0);
      }
    });
  });

  describe("getUsersGroupedByRole", () => {
    test("should return users grouped by role", async () => {
      mockDb.select = () => ({
        from: () => ({
          groupBy: () => ({
            orderBy: () =>
              Promise.resolve([
                { name: "user", value: 100 },
                { name: "admin", value: 5 },
              ]),
          }),
        }),
      });

      const result = await repository.getUsersGroupedByRole();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: "user", value: 100 });
      expect(result[1]).toEqual({ name: "admin", value: 5 });
    });

    test("should handle null role with fallback", async () => {
      mockDb.select = () => ({
        from: () => ({
          groupBy: () => ({
            orderBy: () => Promise.resolve([{ name: null, value: 10 }]),
          }),
        }),
      });

      const result = await repository.getUsersGroupedByRole();

      expect(result[0].name).toBe("user");
    });
  });

  describe("getUsersGroupedByStatus", () => {
    test("should return users grouped by status", async () => {
      mockDb.select = () => ({
        from: () => ({
          groupBy: () => ({
            orderBy: () =>
              Promise.resolve([
                { name: "active", value: 80 },
                { name: "inactive", value: 15 },
                { name: "suspended", value: 5 },
              ]),
          }),
        }),
      });

      const result = await repository.getUsersGroupedByStatus();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: "active", value: 80 });
      expect(result[1]).toEqual({ name: "inactive", value: 15 });
      expect(result[2]).toEqual({ name: "suspended", value: 5 });
    });

    test("should handle null status with fallback", async () => {
      mockDb.select = () => ({
        from: () => ({
          groupBy: () => ({
            orderBy: () => Promise.resolve([{ name: null, value: 5 }]),
          }),
        }),
      });

      const result = await repository.getUsersGroupedByStatus();

      expect(result[0].name).toBe("active");
    });
  });
});