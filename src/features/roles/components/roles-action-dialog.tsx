/**
 * Roles action dialog for creating and editing roles.
 * Uses TanStack Form with Zod validation.
 */

"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "~/components/ui/checkbox";
import { roleFormSchema, type Role } from "../data/schema";
import { permissionsStore } from "~/lib/stores/dashboard/roles";
import type { Permission } from "../data/schema";

type RolesActionDialogProps = {
  currentRow?: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function RolesActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSuccess,
}: RolesActionDialogProps) {
  const isEdit = !!currentRow;
  const { permissions } = useStore(permissionsStore);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  useEffect(() => {
    if (currentRow) {
      setSelectedPermIds(currentRow.permissions ?? []);
    } else {
      setSelectedPermIds([]);
    }
  }, [currentRow, open]);

  const form = useForm({
    defaultValues: isEdit
      ? {
          name: currentRow.name ?? "",
          description: currentRow.description ?? "",
          isDefault: currentRow.isDefault ?? false,
        }
      : {
          name: "",
          description: "",
          isDefault: false,
        },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: {
      onChange: roleFormSchema as any,
    },
    onSubmit: async ({ value }) => {
      try {
        const requestData = {
          name: value.name,
          description: value.description || undefined,
          isDefault: value.isDefault,
          permissionIds: selectedPermIds,
        };

        const endpoint = isEdit ? `/api/roles/${currentRow.id}` : "/api/roles";
        const method = isEdit ? "PUT" : "POST";

        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || `Failed to ${isEdit ? "update" : "create"} role`);
          return;
        }

        toast.success(`Role ${isEdit ? "updated" : "created"} successfully`);
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } catch {
        toast.error(`Error ${isEdit ? "updating" : "creating"} role`);
      }
    },
  });

  const isSubmitting = useStore(form.baseStore, (state) => state.isSubmitting);

  const togglePermission = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  };

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
          <DialogTitle>{isEdit ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the role's details and permissions."
              : "Define a new role with specific permissions."}
          </DialogDescription>
        </DialogHeader>
        <Form form={form} id="roles-action-form">
          <div className="space-y-4">
            <FormField
              name="name"
              children={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., moderator"
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
            <FormField
              name="isDefault"
              children={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <div className="col-span-2" />
                  <div className="col-span-4 flex items-center gap-2">
                    <Checkbox
                      id="role-default"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                    <FormLabel htmlFor="role-default" className="font-normal">
                      Set as default role for new users
                    </FormLabel>
                  </div>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              name="permissionIds"
              children={() => (
                <FormItem className="grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end pt-2">Permissions</FormLabel>
                  <div className="col-span-4">
                    {permissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No permissions available. Create permissions first.
                      </p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-2">
                        {permissions.map((perm: Permission) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedPermIds.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <span className="font-mono text-xs">{perm.name}</span>
                            {perm.description && (
                              <span className="text-xs text-muted-foreground ml-1">
                                — {perm.description}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
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