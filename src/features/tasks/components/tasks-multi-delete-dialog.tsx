"use client";

import { type Table } from "@tanstack/react-table";
import { MultiDeleteDialog } from "~/components/shared/multi-delete-dialog";

type TaskMultiDeleteDialogProps<TData> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<TData>;
};

export function TasksMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: TaskMultiDeleteDialogProps<TData>) {
  return (
    <MultiDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      table={table}
      entityName="task"
      formId="tasks-multi-delete-form"
    />
  );
}