/**
 * Roles delete confirmation dialog.
 * Requires confirmation by typing the role name.
 */

"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { type Role } from "../data/schema";

type RolesDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Role;
  onSuccess?: () => void;
};

export function RolesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: RolesDeleteDialogProps) {
  const [value, setValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (value.trim() !== currentRow.name) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/roles/${currentRow.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete role");
        return;
      }

      toast.success("Role deleted successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form="roles-delete-form"
      disabled={value.trim() !== currentRow.name || isDeleting}
      isLoading={isDeleting}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> Delete Role
        </span>
      }
      desc={
        <form
          id="roles-delete-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleDelete();
          }}
          className="space-y-4"
        >
          <p className="mb-2">
            Are you sure you want to delete <span className="font-bold">{currentRow.name}</span>?
            <br />
            This action cannot be undone. Users assigned this role will lose its permissions.
          </p>

          <Label className="my-2">
            Role name:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter role name to confirm deletion."
              autoFocus
            />
          </Label>

          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Users currently assigned this role will lose access to associated permissions.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText="Delete"
      destructive
    />
  );
}