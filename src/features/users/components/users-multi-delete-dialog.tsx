"use client";

import { type Table } from "@tanstack/react-table";
import { MultiDeleteDialog } from "~/components/shared/multi-delete-dialog";

type UserMultiDeleteDialogProps<TData> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<TData>;
};

export function UsersMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: UserMultiDeleteDialogProps<TData>) {
  return (
    <MultiDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      table={table}
      entityName="user"
      formId="users-multi-delete-form"
    />
  );
}