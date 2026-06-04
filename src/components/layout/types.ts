import { type LinkProps } from "@tanstack/react-router";
import type { UserRole, Permission } from "~/lib/auth/permissions";

type User = {
  name: string;
  email: string;
  avatar: string;
};

type Team = {
  name: string;
  logo: React.ElementType;
  plan: string;
};

type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  /** Static roles that can see this item. Kept for backward compatibility. */
  roles?: UserRole[];
  /** Dynamic permission required to see this item. Takes precedence over roles when set. */
  permission?: Permission;
  /** If true, item is visible but disabled (not clickable) */
  disabled?: boolean;
  /** Message shown when disabled item is clicked */
  disabledMessage?: string;
};

type NavLink = BaseNavItem & {
  url: LinkProps["to"] | (string & {});
  items?: never;
};

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps["to"] | (string & {}) })[];
  url?: never;
};

type NavItem = NavCollapsible | NavLink;

type NavGroup = {
  title: string;
  items: NavItem[];
  /** Static roles that can see this group. Kept for backward compatibility. */
  roles?: UserRole[];
  /** Dynamic permission required to see this group. Takes precedence over roles when set. */
  permission?: Permission;
};

type SidebarData = {
  user: User;
  teams: Team[];
  navGroups: NavGroup[];
};

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink };