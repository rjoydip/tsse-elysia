/**
 * Permissions dialog orchestrator.
 * Renders the appropriate dialog based on the current dialog state.
 */

import { PermissionsActionDialog } from "./permissions-action-dialog";
import { PermissionsDeleteDialog } from "./permissions-delete-dialog";
import { usePermissions } from "./permissions-provider";

export function PermissionsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, refetch } = usePermissions();
  return (
    <>
      <PermissionsActionDialog
        key="perm-add"
        open={open === "add"}
        onOpenChange={() => setOpen("add")}
        onSuccess={refetch}
      />

      {currentRow && (
        <>
          <PermissionsActionDialog
            key={`perm-edit-${currentRow.id}`}
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

          <PermissionsDeleteDialog
            key={`perm-delete-${currentRow.id}`}
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