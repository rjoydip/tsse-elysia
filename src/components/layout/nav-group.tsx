import { type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { Permission } from "~/lib/auth/permissions";
import {
  type NavCollapsible,
  type NavItem,
  type NavLink,
  type NavGroup as NavGroupProps,
} from "./types";
import { useMyPermissions } from "~/hooks/use-my-permissions";
import { usePermission } from "~/hooks/use-permission";
import { toast } from "sonner";

/**
 * Check if item is visible based on dynamic permission or static role.
 */
function isItemVisible(
  item: NavItem,
  userRole: string,
  can: (perm: Permission) => boolean,
): boolean {
  // Permission-based check takes precedence
  if (item.permission) return can(item.permission);
  // Fall back to static role check
  if (item.roles) return item.roles.includes(userRole as any);
  return true;
}

/**
 * Check if group is visible based on dynamic permission or static role.
 */
function isGroupVisible(
  group: NavGroupProps,
  userRole: string,
  can: (perm: Permission) => boolean,
): boolean {
  if (group.permission) return can(group.permission);
  if (group.roles) return group.roles.includes(userRole as any);
  return true;
}

/**
 * Filter items by permission/role and handle disabled state.
 */
function filterItems(
  items: NavItem[],
  userRole: string,
  can: (perm: Permission) => boolean,
): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    if (!isItemVisible(item, userRole, can)) return acc;
    if (item.items) {
      const filteredSubItems = item.items.filter((subItem) =>
        isItemVisible(subItem, userRole, can),
      );
      if (filteredSubItems.length === 0) return acc;
      acc.push({ ...item, items: filteredSubItems });
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}

export function NavGroup({ title, items, roles, permission }: NavGroupProps) {
  const { state, isMobile } = useSidebar();
  const href = useLocation({ select: (location) => location.href });
  const { role } = usePermission();
  const { can } = useMyPermissions();

  if (!isGroupVisible({ title, items, roles, permission }, role, can)) {
    return null;
  }

  const filteredItems = filterItems(items, role, can);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => {
          const key = `${item.title}-${item.url}`;

          if (!item.items) return <SidebarMenuLink key={key} item={item} href={href} />;

          if (state === "collapsed" && !isMobile)
            return <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />;

          return <SidebarMenuCollapsible key={key} item={item} href={href} />;
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>;
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      toast.info(item.disabledMessage || "This feature is not available yet");
      return;
    }
    setOpenMobile(false);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
        disabled={item.disabled}
      >
        <Link
          to={item.disabled ? "#" : item.url}
          onClick={handleClick}
          className={item.disabled ? "cursor-not-allowed opacity-50" : ""}
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarMenuCollapsible({ item, href }: { item: NavCollapsible; href: string }) {
  const { setOpenMobile } = useSidebar();
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent">
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild isActive={checkIsActive(href, subItem)}>
                  <Link
                    to={subItem.disabled ? "#" : subItem.url}
                    onClick={(e) => {
                      if (subItem.disabled) {
                        e.preventDefault();
                        toast.info(subItem.disabledMessage || "This feature is not available yet");
                        return;
                      }
                      setOpenMobile(false);
                    }}
                    className={
                      subItem.disabled ? "cursor-not-allowed opacity-50 pointer-events-none" : ""
                    }
                  >
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                    {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function SidebarMenuCollapsedDropdown({ item, href }: { item: NavCollapsible; href: string }) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={checkIsActive(href, item)}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ms-auto transition-transform duration-200 group/data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ""}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild disabled={sub.disabled}>
              <Link
                to={sub.disabled ? "#" : sub.url}
                onClick={(e) => {
                  if (sub.disabled) {
                    e.preventDefault();
                    toast.info(sub.disabledMessage || "This feature is not available yet");
                  }
                }}
                className={`${checkIsActive(href, sub) ? "bg-secondary" : ""} ${sub.disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {sub.icon && <sub.icon />}
                <span className="max-w-52 text-wrap">{sub.title}</span>
                {sub.badge && <span className="ms-auto text-xs">{sub.badge}</span>}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split("?")[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav && href.split("/")[1] !== "" && href.split("/")[1] === item?.url?.split("/")[1])
  );
}