"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { type User } from "../data/schema";

type UserDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: User;
  onSuccess?: () => void;
};

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (value.trim() !== currentRow.username) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${currentRow.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "inactive" }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to deactivate user");
        return;
      }

      toast.success("User deactivated successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to deactivate user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form="users-delete-form"
      disabled={value.trim() !== currentRow.username || isDeleting}
      isLoading={isDeleting}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> Deactivate
          User
        </span>
      }
      desc={
        <form
          id="users-delete-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleDelete();
          }}
          className="space-y-4"
        >
          <p className="mb-2">
            Are you sure you want to deactivate{" "}
            <span className="font-bold">{currentRow.username}</span>
            ?
            <br />
            This will set the user status to inactive. The user with role of{" "}
            <span className="font-bold">{currentRow.role.toUpperCase()}</span> will lose access to
            the system.
          </p>

          <Label className="my-2">
            Username:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter username to confirm deactivation."
              autoFocus
            />
          </Label>

          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              The user will be marked as inactive and lose access to the system.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText="Deactivate"
      destructive
    />
  );
}