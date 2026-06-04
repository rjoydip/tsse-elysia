/**
 * Permissions context provider for dialog state management.
 * Follows the same pattern as UsersProvider.
 */

import React, { useState } from "react";
import useDialogState from "~/hooks/use-dialog-state";
import { permissionsActions } from "~/lib/stores/dashboard/roles";
import { type Permission } from "../data/schema";

type PermissionsDialogType = "add" | "edit" | "delete";

type PermissionsContextType = {
  open: PermissionsDialogType | null;
  setOpen: (str: PermissionsDialogType | null) => void;
  currentRow: Permission | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Permission | null>>;
  refetch: () => Promise<void>;
  isRefetching: boolean;
};

const PermissionsContext = React.createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<PermissionsDialogType>(null);
  const [currentRow, setCurrentRow] = useState<Permission | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  const refetch = async () => {
    setIsRefetching(true);
    try {
      await permissionsActions.fetchAll();
    } finally {
      setIsRefetching(false);
    }
  };

  return (
    <PermissionsContext value={{ open, setOpen, currentRow, setCurrentRow, refetch, isRefetching }}>
      {children}
    </PermissionsContext>
  );
}

export const usePermissions = () => {
  const permissionsContext = React.useContext(PermissionsContext);

  if (!permissionsContext) {
    throw new Error("usePermissions has to be used within <PermissionsContext>");
  }

  return permissionsContext;
};