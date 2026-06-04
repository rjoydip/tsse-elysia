/**
 * Primary action buttons for the roles tab.
 */

import { RefreshCw, ShieldPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRoles } from "./roles-provider";

export function RolesPrimaryButtons() {
  const { setOpen, refetch, isRefetching } = useRoles();
  return (
    <div className="flex gap-2">
      <Button variant="outline" className="space-x-1" onClick={refetch} disabled={isRefetching}>
        <RefreshCw size={18} className={isRefetching ? "animate-spin" : ""} />
        <span>{isRefetching ? "Loading..." : "Refresh"}</span>
      </Button>
      <Button className="space-x-1" onClick={() => setOpen("add")}>
        <span>Add Role</span>
        <ShieldPlus size={18} />
      </Button>
    </div>
  );
}