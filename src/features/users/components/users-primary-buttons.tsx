import { MailPlus, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useUsers } from "./users-provider";

export function UsersPrimaryButtons() {
  const { setOpen, refetch, isRefetching } = useUsers();
  return (
    <div className="flex gap-2">
      <Button variant="outline" className="space-x-1" onClick={refetch} disabled={isRefetching}>
        <RefreshCw size={18} className={isRefetching ? "animate-spin" : ""} />
        <span>{isRefetching ? "Loading..." : "Refresh"}</span>
      </Button>
      <Button variant="outline" className="space-x-1" onClick={() => setOpen("invite")}>
        <span>Invite User</span> <MailPlus size={18} />
      </Button>
      <Button className="space-x-1" onClick={() => setOpen("add")}>
        <span>Add User</span> <UserPlus size={18} />
      </Button>
    </div>
  );
}