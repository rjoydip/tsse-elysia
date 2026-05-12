import { useLayout } from "~/context/layout-provider";
import { useSession } from "~/lib/auth/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { AppTitle } from "./app-title";
import { sidebarData } from "./data/sidebar";
import { NavGroup } from "./nav-group";
import { NavUser, type NavUserProps } from "./nav-user";
import { env } from "~/config/env";
import { TeamSwitcher } from "./team-switcher";

export function AppSidebar() {
  const { collapsible, variant } = useLayout();
  const { data: session } = useSession();

  // Get user data from session or fallback to sidebarData
  const userData: NavUserProps = {
    name: session?.user?.name || sidebarData.user.name,
    email: session?.user?.email || sidebarData.user.email,
    image: session?.user?.image || sidebarData.user.avatar,
  };

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        {env.FEATURE_MULTI_TEAM && <TeamSwitcher teams={sidebarData.teams} />}
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}