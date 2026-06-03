/**
 * Primary action buttons for the permissions tab.
 */

import { Key, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { usePermissions } from "./permissions-provider";

export function PermissionsPrimaryButtons() {
  const { setOpen, refetch, isRefetching } = usePermissions();

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="space-x-1" onClick={refetch} disabled={isRefetching}>
        <RefreshCw size={18} className={isRefetching ? "animate-spin" : ""} />
        <span>{isRefetching ? "Loading..." : "Refresh"}</span>
      </Button>
      <Button className="space-x-1" onClick={() => setOpen("add")}>
        <span>Add Permission</span>
        <Key size={18} />
      </Button>
    </div>
  );
}