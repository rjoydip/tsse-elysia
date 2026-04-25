import React from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { ArrowRight, Laptop, Moon, Sun } from "lucide-react";
import { useSearch } from "~/context/search-provider";
import { useTheme } from "~/context/theme-provider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import { ScrollArea } from "./ui/scroll-area";

interface NavItem {
  title: string;
  url: string;
  badge?: string;
}

const LANDING_PAGES: NavItem[] = [
  { title: "Home", url: "/" },
  { title: "Documentation", url: "/docs" },
  { title: "Blog", url: "/blog" },
  { title: "Changelog", url: "/changelog" },
  { title: "Status", url: "/status" },
  { title: "Privacy Policy", url: "/privacy" },
  { title: "Terms of Service", url: "/terms" },
  { title: "Sign In", url: "/signin" },
  { title: "Sign Up", url: "/signup" },
  { title: "Forgot Password", url: "/forgot-password" },
];

const DASHBOARD_PAGES: NavItem[] = [
  { title: "Dashboard", url: "/dashboard" },
  { title: "Tasks", url: "/dashboard/tasks" },
  { title: "Apps", url: "/dashboard/apps" },
  { title: "Chats", url: "/dashboard/chats", badge: "3" },
  { title: "Users", url: "/dashboard/users" },
  { title: "Settings", url: "/dashboard/settings" },
  { title: "Account", url: "/dashboard/settings/account" },
  { title: "Appearance", url: "/dashboard/settings/appearance" },
  { title: "Notifications", url: "/dashboard/settings/notifications" },
  { title: "Help Center", url: "/help-center" },
];

export function CommandMenu() {
  const navigate = useNavigate();
  const location = useLocation({ select: (loc) => loc.pathname });
  const { setTheme } = useTheme();
  const { open, setOpen } = useSearch();

  const isLandingPage = !location.startsWith("/dashboard") && !location.startsWith("/help-center");
  const isDashboardPage = location.startsWith("/dashboard") || location.startsWith("/help-center");

  const navPages = isDashboardPage
    ? DASHBOARD_PAGES
    : isLandingPage
      ? LANDING_PAGES
      : [...LANDING_PAGES, ...DASHBOARD_PAGES];

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    [setOpen],
  );

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <ScrollArea type="hover" className="h-72 pe-1">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup key="navigation" heading="Navigation">
            {navPages.map((navItem, i) => (
              <CommandItem
                key={`${navItem.url}-${i}`}
                value={navItem.title}
                onSelect={() => {
                  runCommand(() => navigate({ to: navItem.url }));
                }}
              >
                <div className="flex size-4 items-center justify-center">
                  <ArrowRight className="size-2 text-muted-foreground/80" />
                </div>
                {navItem.title}
                {navItem.badge && (
                  <span className="ms-auto text-xs text-muted-foreground">{navItem.badge}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="scale-90" />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Laptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  );
}