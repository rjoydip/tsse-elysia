/**
 * RecentUsers component.
 * Displays a virtualized list of recently registered users with avatar, name, email, and role.
 * Uses TanStack Virtual for performant scrolling and infinite scrolling.
 * Each scroll near the bottom triggers a batch load of more users.
 */

import { useCallback, useRef } from "react";
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
  const { recentUsers, loading, error, loadMore, hasMore } = useRecentUsers(
    RECENT_USERS_COUNT,
    max,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(recentUsers.length);

  // Fire the callback whenever the count changes
  if (recentUsers.length !== prevCount.current) {
    prevCount.current = recentUsers.length;
    onLoadCountChange?.(recentUsers.length);
  }

  /**
   * Triggers loading the next batch when the user scrolls near the bottom.
   * Uses a threshold of 4 rows from the end to start fetching early.
   * Stops fetching when hasMore is false.
   */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;

    const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (scrollBottom < ROW_HEIGHT * 4) {
      loadMore();
    }
  }, [loading, loadMore, hasMore]);

  const rowVirtualizer = useVirtualizer({
    count: recentUsers.length + (loading && hasMore ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  });

  // ------ Loading state (initial load only) ------
  if (loading && recentUsers.length === 0) {
    return (
      <div className="space-y-8">
        {Array.from({ length: RECENT_USERS_COUNT }, (_, _i) => _i + 1).map((_, index) => (
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
  if (!loading && recentUsers.length === 0) {
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