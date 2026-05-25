/**
 * Shared user row component for dashboard displays.
 * Shows user avatar, name, email, and an optional value (role, amount, etc.).
 */

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

interface UserRowProps {
  /** URL to avatar image */
  avatarSrc: string;
  /** Fallback initials if image fails to load */
  fallback: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** Optional value to display (e.g., role label, amount) */
  amount?: string;
}

/**
 * A standardized row displaying user info with avatar and optional value.
 * Used in recent users, team lists, etc.
 */
export function UserRow({ avatarSrc, fallback, name, email, amount }: UserRowProps) {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-9 w-9">
        <AvatarImage src={avatarSrc} alt="Avatar" />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-wrap items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm leading-none font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        {amount && <div className="font-medium">{amount}</div>}
      </div>
    </div>
  );
}