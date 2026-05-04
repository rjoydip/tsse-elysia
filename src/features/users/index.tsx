import { getRouteApi } from "@tanstack/react-router";
import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { UsersDialogs } from "./components/users-dialogs";
import { UsersPrimaryButtons } from "./components/users-primary-buttons";
import { UsersProvider } from "./components/users-provider";
import { UsersTable } from "./components/users-table";
import { usersActions, useUsersStore } from "~/lib/stores/dashboard/users";
import type { User } from "./data/schema";
import { useEffect } from "react";

const route = getRouteApi("/_authenticated/dashboard/users/");

interface UsersProps {
  initialUsers?: User[];
  isLoading?: boolean;
  error?: string | null;
}

export function Users({ initialUsers = [], isLoading = false, error = null }: UsersProps) {
  const search = route.useSearch();
  const navigate = route.useNavigate();

  const { users, loading, error: storeError } = useUsersStore();

  useEffect(() => {
    if (users.length === 0) {
      usersActions.fetchAll();
    }
  }, []);

  const data = users.length > 0 ? users : initialUsers;
  const isLoadingState = users.length === 0 ? isLoading : loading;
  const errorState = storeError ?? error;

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">Manage your users and their roles here.</p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable
          data={data}
          search={search}
          navigate={navigate}
          isLoading={isLoadingState}
          error={errorState}
        />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  );
}