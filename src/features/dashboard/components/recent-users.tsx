/**
 * RecentUsers component.
 * Displays a list of recently registered users with avatar, name, email, and role.
 * Uses real user data from the dashboard API.
 */

import { motion } from "motion/react";
import { useRecentUsers } from "~/hooks/use-recent-users";
import { RECENT_USERS_COUNT } from "~/config";
import { UserRow } from "./shared/user-row";

export function RecentUsers() {
  const { recentUsers, loading, error } = useRecentUsers(RECENT_USERS_COUNT);

  if (loading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: RECENT_USERS_COUNT }, (_, i) => i + 1).map((_, index) => (
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

  if (error) {
    return (
      <div className="space-y-8 text-center text-muted-foreground py-8">
        Failed to load recent users: {error}
      </div>
    );
  }

  // If no data, show empty state
  if (!recentUsers || recentUsers.length === 0) {
    return (
      <div className="space-y-8 text-center text-muted-foreground py-8">
        No recent users available
      </div>
    );
  }

  return (
    <div className="h-[350px] space-y-8 overflow-y-auto pr-2">
      {recentUsers.map((user, index) => (
        <motion.div
          key={user.id ?? index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <UserRow
            avatarSrc={user.avatarSrc}
            fallback={user.fallback}
            name={user.name}
            email={user.email}
          />
        </motion.div>
      ))}
    </div>
  );
}