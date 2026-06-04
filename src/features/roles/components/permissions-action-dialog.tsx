/**
 * Permissions action dialog for creating and editing permissions.
 * Uses TanStack Form with Zod validation.
 */

"use client";

import { useStore } from "@tanstack/react-store";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { permissionFormSchema, type Permission } from "../data/schema";

type PermissionsActionDialogProps = {
  currentRow?: Permission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function PermissionsActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSuccess,
}: PermissionsActionDialogProps) {
  const isEdit = !!currentRow;

  const form = useForm({
    defaultValues: isEdit
      ? {
          name: currentRow.name ?? "",
          description: currentRow.description ?? "",
        }
      : {
          name: "",
          description: "",
        },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: {
      onChange: permissionFormSchema as any,
    },
    onSubmit: async ({ value }) => {
      try {
        const requestData = {
          name: value.name,
          description: value.description || undefined,
        };

        const endpoint = isEdit
          ? `/api/roles/permissions/${currentRow.id}`
          : "/api/roles/permissions";
        const method = isEdit ? "PUT" : "POST";

        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || `Failed to ${isEdit ? "update" : "create"} permission`);
          return;
        }

        toast.success(`Permission ${isEdit ? "updated" : "created"} successfully`);
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } catch {
        toast.error(`Error ${isEdit ? "updating" : "creating"} permission`);
      }
    },
  });

  const isSubmitting = useStore(form.baseStore, (state) => state.isSubmitting);

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>{isEdit ? "Edit Permission" : "Create Permission"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the permission details." : "Define a new permission for your system."}
          </DialogDescription>
        </DialogHeader>
        <Form form={form} id="permissions-action-form">
          <div className="space-y-4">
            <FormField
              name="name"
              children={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., users:create"
                      className="col-span-4"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              children={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional description"
                      className="col-span-4"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}