/**
 * Roles and Permissions management page.
 * Provides UI for creating, viewing, and managing roles and permissions.
 * Uses store/provider/table/dialog pattern for state management.
 */

import { useEffect } from "react";
import { motion } from "motion/react";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { ConfigDrawer } from "~/components/config-drawer";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { rolesActions, permissionsActions } from "~/lib/stores/dashboard/roles";
import { RolesProvider } from "./components/roles-provider";
import { PermissionsProvider } from "./components/permissions-provider";
import { RolesTable } from "./components/roles-table";
import { PermissionsTable } from "./components/permissions-table";
import { RolesPrimaryButtons } from "./components/roles-primary-buttons";
import { PermissionsPrimaryButtons } from "./components/permissions-primary-buttons";
import { RolesDialogs } from "./components/roles-dialogs";
import { PermissionsDialogs } from "./components/permissions-dialogs";
import { RolesOverviewCards } from "./components/roles-overview-cards";

/**
 * Inner content component that requires the RolesProvider context.
 */
function RolesContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
          <p className="text-muted-foreground">Manage user roles and their permissions.</p>
        </div>
        <RolesPrimaryButtons />
      </div>
      <RolesTable />
      <RolesDialogs />
    </motion.div>
  );
}

/**
 * Inner content component that requires the PermissionsProvider context.
 */
function PermissionsContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Permissions</h2>
          <p className="text-muted-foreground">Manage individual permissions for the system.</p>
        </div>
        <PermissionsPrimaryButtons />
      </div>
      <PermissionsTable />
      <PermissionsDialogs />
    </motion.div>
  );
}

/**
 * Roles and Permissions page component.
 */
export function RolesPermissionsPage() {
  useEffect(() => {
    rolesActions.fetchAll();
    permissionsActions.fetchAll();
  }, []);

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6 pr-6">
        <RolesOverviewCards />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Tabs defaultValue="roles">
            <TabsList>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="space-y-4 pt-4">
              <RolesProvider>
                <RolesContent />
              </RolesProvider>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 pt-4">
              <PermissionsProvider>
                <PermissionsContent />
              </PermissionsProvider>
            </TabsContent>
          </Tabs>
        </motion.div>
      </Main>
    </>
  );
}