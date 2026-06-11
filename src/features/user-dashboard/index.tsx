/**
 * User Dashboard page component.
 * Wraps the shared UserTaskDashboard content with page-level layout (Header/Main).
 */

import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { ConfigDrawer } from "~/components/config-drawer";
import { ThemeSwitch } from "~/components/theme-switch";
import { Search } from "~/components/search";
import { UserTaskDashboard } from "./user-task-dashboard";

/**
 * User dashboard page component.
 */
export function UserDashboard() {
  return (
    <>
      <Header>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <UserTaskDashboard />
      </Main>
    </>
  );
}