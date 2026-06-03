/**
 * Roles table column definitions.
 * Defines columns for the roles data table.
 */

import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { DataTableColumnHeader } from "~/components/data-table";
import { DataTableRowActions } from "./roles-row-actions";
import type { Role } from "../data/schema";

export const rolesColumns: ColumnDef<Role>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 ps-3 font-medium">
        {row.getValue("name")}
        {row.original.isDefault && (
          <Badge variant="secondary" className="text-xs">
            Default
          </Badge>
        )}
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <span className="max-w-48 truncate text-muted-foreground">
        {row.getValue("description") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "permissions",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Permissions" />,
    cell: ({ row }) => {
      const perms: string[] = row.getValue("permissions");
      return (
        <div className="flex max-w-60 flex-wrap gap-1">
          {perms.length === 0 ? (
            <span className="text-xs text-muted-foreground">None</span>
          ) : (
            perms.slice(0, 4).map((p) => (
              <Badge key={p} variant="outline" className="text-xs">
                {p}
              </Badge>
            ))
          )}
          {perms.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{perms.length - 4}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: DataTableRowActions,
  },
];