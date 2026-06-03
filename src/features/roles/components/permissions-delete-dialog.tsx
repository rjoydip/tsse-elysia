/**
 * Permissions delete confirmation dialog.
 * Requires confirmation by typing the permission name.
 */

"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { type Permission } from "../data/schema";

type PermissionsDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Permission;
  onSuccess?: () => void;
};

export function PermissionsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: PermissionsDeleteDialogProps) {
  const [value, setValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (value.trim() !== currentRow.name) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/roles/permissions/${currentRow.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete permission");
        return;
      }

      toast.success("Permission deleted successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to delete permission");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form="permissions-delete-form"
      disabled={value.trim() !== currentRow.name || isDeleting}
      isLoading={isDeleting}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> Delete
          Permission
        </span>
      }
      desc={
        <form
          id="permissions-delete-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleDelete();
          }}
          className="space-y-4"
        >
          <p className="mb-2">
            Are you sure you want to delete{" "}
            <span className="font-bold font-mono">{currentRow.name}</span>?
            <br />
            This action cannot be undone. Roles using this permission will be affected.
          </p>

          <Label className="my-2">
            Permission name:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter permission name to confirm deletion."
              autoFocus
            />
          </Label>

          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Roles that include this permission will lose it. Users with those roles will be
              affected.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText="Delete"
      destructive
    />
  );
}