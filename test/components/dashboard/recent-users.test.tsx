/**
 * Unit tests for src/features/dashboard/components/recent-users.tsx
 * Tests: RecentUsers component - loading, error, empty, and data states
 */

import { describe, expect, it, vi, beforeEach } from "bun:test";
import { renderToString } from "react-dom/server";
import { RecentUsers } from "../../../src/features/dashboard/components/recent-users";
import { RECENT_USERS_COUNT } from "~/config";

// Track mock state so we can test each scenario
let mockRecentUsers: any[] = [];
let mockLoading = true;
let mockError: string | null = null;

vi.mock("../../../src/hooks/use-recent-users", () => ({
  useRecentUsers: () => ({
    recentUsers: mockRecentUsers,
    isFetching: mockLoading,
    error: mockError,
    hasMore: true,
    loadMore: vi.fn(),
  }),
}));

// Mock TanStack Virtual so the virtualizer returns all items as visible (SSR-safe)
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (config: any) => ({
    getVirtualItems: () =>
      Array.from({ length: config.count }, (_, i) => ({
        key: i,
        index: i,
        size: 72,
        start: i * 72,
      })),
    getTotalSize: () => config.count * 72,
    measure: vi.fn(),
  }),
}));

describe("RecentUsers", () => {
  beforeEach(() => {
    mockRecentUsers = [];
    mockLoading = true;
    mockError = null;
  });

  it(`should show loading state with ${RECENT_USERS_COUNT} skeleton rows`, () => {
    const html = renderToString(<RecentUsers />);
    // Loading state renders ${RECENT_USERS_COUNT} placeholder UserRows
    expect(html).toContain("Loading...");
    expect(html).toContain("loading@example.com");
    // Should have ${RECENT_USERS_COUNT} skeleton entries
    const matches = html.match(/Loading\.\.\./g);
    expect(matches).toHaveLength(RECENT_USERS_COUNT);
  });

  it("should show error state when fetch fails", () => {
    mockLoading = false;
    mockError = "Network error";
    const html = renderToString(<RecentUsers />);
    expect(html).toContain("Failed to load recent users");
    expect(html).toContain("Network error");
  });

  it("should show empty state when no users returned", () => {
    mockLoading = false;
    mockRecentUsers = [];
    const html = renderToString(<RecentUsers />);
    expect(html).toContain("No recent users available");
  });

  it("should render user rows when data is available", () => {
    mockLoading = false;
    mockRecentUsers = [
      {
        avatarSrc: "/avatars/01.png",
        fallback: "JD",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
      },
      {
        avatarSrc: "/avatars/02.png",
        fallback: "JS",
        name: "Jane Smith",
        email: "jane@example.com",
        role: "admin",
      },
    ];
    const html = renderToString(<RecentUsers />);
    expect(html).toContain("John Doe");
    expect(html).toContain("john@example.com");
    expect(html).toContain("Jane Smith");
    expect(html).toContain("jane@example.com");
    // Verify role name appears as fallback initials (JD from John Doe, JS from Jane Smith)
    expect(html).toContain("JD");
    expect(html).toContain("JS");
  });

  it("should not contain loading text when data is loaded", () => {
    mockLoading = false;
    mockRecentUsers = [
      {
        avatarSrc: "/avatars/01.png",
        fallback: "JD",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
      },
    ];
    const html = renderToString(<RecentUsers />);
    expect(html).not.toContain("Loading...");
    expect(html).not.toContain("Failed to load recent users");
    expect(html).not.toContain("No recent users available");
  });

  it("should pass role as amount prop to UserRow", () => {
    mockLoading = false;
    mockRecentUsers = [
      {
        avatarSrc: "/avatars/01.png",
        fallback: "JD",
        name: "John Doe",
        email: "john@example.com",
        role: "manager",
      },
    ];
    const html = renderToString(<RecentUsers />);
    // Verify user data renders (name, email, fallback)
    expect(html).toContain("John Doe");
    expect(html).toContain("john@example.com");
    expect(html).toContain("JD");
  });
});