/**
 * Roles context provider for dialog state management.
 * Follows the same pattern as UsersProvider.
 */

import React, { useState } from "react";
import useDialogState from "~/hooks/use-dialog-state";
import { rolesActions } from "~/lib/stores/dashboard/roles";
import { type Role } from "../data/schema";

type RolesDialogType = "add" | "edit" | "delete";

type RolesContextType = {
  open: RolesDialogType | null;
  setOpen: (str: RolesDialogType | null) => void;
  currentRow: Role | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Role | null>>;
  refetch: () => Promise<void>;
  isRefetching: boolean;
};

const RolesContext = React.createContext<RolesContextType | null>(null);

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<RolesDialogType>(null);
  const [currentRow, setCurrentRow] = useState<Role | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  const refetch = async () => {
    setIsRefetching(true);
    try {
      await rolesActions.fetchAll();
    } finally {
      setIsRefetching(false);
    }
  };

  return (
    <RolesContext value={{ open, setOpen, currentRow, setCurrentRow, refetch, isRefetching }}>
      {children}
    </RolesContext>
  );
}

export const useRoles = () => {
  const rolesContext = React.useContext(RolesContext);

  if (!rolesContext) {
    throw new Error("useRoles has to be used within <RolesContext>");
  }

  return rolesContext;
};