import { type LinkProps } from "@tanstack/react-router";
import type { UserRole } from "~/lib/auth/permissions";

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
  /** Roles that can see this item. If not specified, visible to all. */
  roles?: UserRole[];
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
  /** Roles that can see this group. If not specified, visible to all. */
  roles?: UserRole[];
};

type SidebarData = {
  user: User;
  teams: Team[];
  navGroups: NavGroup[];
};

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink };