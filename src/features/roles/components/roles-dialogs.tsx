/**
 * Roles dialog orchestrator.
 * Renders the appropriate dialog based on the current dialog state.
 */

import { RolesActionDialog } from "./roles-action-dialog";
import { RolesDeleteDialog } from "./roles-delete-dialog";
import { useRoles } from "./roles-provider";

export function RolesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, refetch } = useRoles();
  return (
    <>
      <RolesActionDialog
        key="role-add"
        open={open === "add"}
        onOpenChange={() => setOpen("add")}
        onSuccess={refetch}
      />

      {currentRow && (
        <>
          <RolesActionDialog
            key={`role-edit-${currentRow.id}`}
            open={open === "edit"}
            onOpenChange={() => {
              setOpen("edit");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
            onSuccess={refetch}
          />

          <RolesDeleteDialog
            key={`role-delete-${currentRow.id}`}
            open={open === "delete"}
            onOpenChange={() => {
              setOpen("delete");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
            onSuccess={refetch}
          />
        </>
      )}
    </>
  );
}