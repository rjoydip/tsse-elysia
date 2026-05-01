/**
 * Shared Multi-Delete Dialog component.
 * Extracted from tasks-multi-delete-dialog.tsx and users-multi-delete-dialog.tsx to reduce duplication.
 */

"use client";

import { useState } from "react";
import { type Table } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { sleep } from "~/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ConfirmDialog } from "~/components/confirm-dialog";

interface MultiDeleteDialogProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<TData>;
  /** Entity name for messages (e.g., "task", "user") */
  entityName: string;
  /** Form ID for the dialog */
  formId: string;
}

const CONFIRM_WORD = "DELETE";

/**
 * A reusable confirmation dialog for deleting multiple table rows.
 * Requires typing "DELETE" to confirm the action.
 *
 * @template TData - The type of data in the table rows
 */
export function MultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
  entityName,
  formId,
}: MultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState("");
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleDelete = () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Please type "${CONFIRM_WORD}" to confirm.`);
      return;
    }

    onOpenChange(false);

    toast.promise(sleep(2000), {
      loading: `Deleting ${entityName}s...`,
      success: () => {
        setValue("");
        table.resetRowSelection();
        return `Deleted ${selectedRows.length} ${selectedRows.length > 1 ? `${entityName}s` : entityName}`;
      },
      error: "Error",
    });
  };

  const entityPlural = selectedRows.length > 1 ? `${entityName}s` : entityName;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form={formId}
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> Delete{" "}
          {selectedRows.length} {entityPlural}
        </span>
      }
      desc={
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            handleDelete();
          }}
          className="space-y-4"
        >
          <p className="mb-2">
            Are you sure you want to delete the selected {entityPlural}? <br />
            This action cannot be undone.
          </p>

          <Label className="my-4 flex flex-col items-start gap-1.5">
            <span className="">Confirm by typing "{CONFIRM_WORD}":</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Type "${CONFIRM_WORD}" to confirm.`}
              autoFocus
            />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText="Delete"
      destructive
    />
  );
}