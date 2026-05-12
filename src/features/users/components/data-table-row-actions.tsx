import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { type Row } from "@tanstack/react-table";
import { Trash2, UserPen, Power, Key } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { toast } from "sonner";
import { type User } from "../data/schema";
import { useUsers } from "./users-provider";

type DataTableRowActionsProps = {
  row: Row<User>;
};

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow, refetch } = useUsers();
  const user = row.original;
  const isInactive = user.status === "inactive";

  const handleActivate = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "active" }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to activate user");
        return;
      }

      toast.success("User activated successfully");
      refetch();
    } catch {
      toast.error("Failed to activate user");
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to reset password");
        return;
      }

      const data = await response.json();
      if (data.password) {
        toast.success(`Password reset successfully. New password: ${data.password}`);
      } else {
        toast.info("Password reset is not available");
      }
    } catch {
      toast.error("Failed to reset password");
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user);
              setOpen("edit");
            }}
          >
            Edit
            <DropdownMenuShortcut>
              <UserPen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetPassword}>
            Reset Password
            <DropdownMenuShortcut>
              <Key size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isInactive ? (
            <DropdownMenuItem onClick={handleActivate}>
              Activate
              <DropdownMenuShortcut>
                <Power size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(user);
                setOpen("delete");
              }}
              className="text-red-500!"
            >
              Deactivate
              <DropdownMenuShortcut>
                <Trash2 size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}