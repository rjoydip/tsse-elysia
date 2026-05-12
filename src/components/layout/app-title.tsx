import { Link } from "@tanstack/react-router";
import { Logo } from "~/assets/logo";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { useAuthStore } from "~/lib/stores/auth";

export function AppTitle() {
  const { open, isMobile, setOpenMobile } = useSidebar();
  const authState = useAuthStore();

  const role = authState.user?.role?.[0];
  const displayTitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Dashboard";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="gap-0 py-0 hover:bg-transparent active:bg-transparent"
          asChild
        >
          <Link
            to="/"
            onClick={() => setOpenMobile(false)}
            className="flex items-center gap-2 text-start"
          >
            <Logo className="me-1 size-8!" />
            {(open || !isMobile) && (
              <span className="truncate font-bold text-lg">{displayTitle}</span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}