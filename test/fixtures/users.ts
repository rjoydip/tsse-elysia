/**
 * User test fixtures for API contract tests.
 * Provides reusable mock user data and factory functions.
 */

/**
 * Represents a test user with common fields.
 */
export interface TestUser {
  /** Unique identifier */
  id: string;
  /** Email address */
  email: string;
  /** Display name */
  name: string;
  /** User role */
  role: string;
}

/**
 * Creates a mock user for testing.
 *
 * @param overrides - Optional partial fields to override defaults
 * @returns A TestUser object
 */
export const mockUser = (overrides?: Partial<TestUser>): TestUser => ({
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  role: "user",
  ...overrides,
});

/**
 * Creates an admin mock user for testing.
 *
 * @param overrides - Optional partial fields to override defaults
 * @returns A TestUser object with admin role
 */
export const mockAdmin = (overrides?: Partial<TestUser>): TestUser =>
  mockUser({
    id: "admin-user-id",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    ...overrides,
  });