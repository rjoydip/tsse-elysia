/**
 * RecentUsers component.
 * Displays a virtualized list of recently registered users with avatar, name, email, and role.
 * Uses TanStack Virtual for performant scrolling and infinite scrolling.
 * Each scroll near the bottom triggers a batch load of more users.
 */

import { useCallback, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRecentUsers } from "~/hooks/use-recent-users";
import { RECENT_USERS_COUNT } from "~/config";
import { UserRow } from "./shared/user-row";

/**
 * Estimated row height for the virtualizer (in pixels).
 */
const ROW_HEIGHT = 72;

/**
 * Props for the RecentUsers component.
 */
export interface RecentUsersProps {
  /** Callback fired whenever the loaded user count changes */
  onLoadCountChange?: (count: number) => void;
  /** Hard cap — stop loading when offset reaches this value */
  max?: number;
}

export function RecentUsers({ onLoadCountChange, max }: RecentUsersProps) {
  const {
    recentUsers,
    loading: isLoading,
    error,
    loadMore,
    hasMore,
  } = useRecentUsers(RECENT_USERS_COUNT, max);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Ref stores the latest loadMore function to prevent stale closures in the scroll handler.
  // handleScroll is recreated only when isLoading/hasMore change, but loadMoreRef.current
  // always points to the latest loadMore from the hook, so the async fetch never uses a stale ref.
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  // Fire onLoadCountChange in a useEffect to comply with React rules
  useEffect(() => {
    onLoadCountChange?.(recentUsers.length);
  }, [recentUsers.length, onLoadCountChange]);

  /**
   * Triggers loading the next batch when the user scrolls near the bottom.
   * Uses a threshold of 4 rows from the end to start fetching early.
   * Stops fetching when hasMore is false.
   * Uses a ref for loadMore so the scroll handler stays stable across renders.
   */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isLoading || !hasMore) return;

    const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (scrollBottom < ROW_HEIGHT * 4) {
      loadMoreRef.current();
    }
  }, [isLoading, hasMore]);

  // The virtualizer count is bumped by 1 when loading + hasMore are both true.
  // This extra slot renders a "Loading more..." row at the bottom.
  // The user lookup for that index returns undefined, which triggers isLoadingMore.
  const rowVirtualizer = useVirtualizer({
    count: recentUsers.length + (isLoading && hasMore ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  });

  // ------ Loading state (initial load only) ------
  if (isLoading && recentUsers.length === 0) {
    return (
      <div className="space-y-8">
        {Array.from({ length: RECENT_USERS_COUNT }).map((_, index) => (
          <UserRow
            key={index}
            avatarSrc="/avatars/01.png"
            fallback="--"
            name="Loading..."
            email="loading@example.com"
          />
        ))}
      </div>
    );
  }

  // ------ Error state ------
  if (error && recentUsers.length === 0) {
    return (
      <div className="space-y-8 text-center text-muted-foreground py-8">
        Failed to load recent users: {error}
      </div>
    );
  }

  // ------ Empty state ------
  if (!isLoading && recentUsers.length === 0) {
    return (
      <div className="space-y-8 text-center text-muted-foreground py-8">
        No recent users available
      </div>
    );
  }

  // ------ Virtualized list with infinite scroll ------
  return (
    <div ref={scrollRef} className="h-[350px] overflow-y-auto pr-2" onScroll={handleScroll}>
      <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const user = recentUsers[virtualItem.index];
          const isLoadingMore = !user;

          return (
            <div
              key={virtualItem.key}
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {isLoadingMore ? (
                <div className="flex items-center gap-4 px-2 py-3 text-sm text-muted-foreground">
                  Loading more...
                </div>
              ) : (
                <UserRow
                  avatarSrc={user.avatarSrc}
                  fallback={user.fallback}
                  name={user.name}
                  email={user.email}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}