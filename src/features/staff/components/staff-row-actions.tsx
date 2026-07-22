"use client";

import { Pencil } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";

export function StaffRowActions({
  staffId,
  staffName,
}: {
  staffId: string;
  staffName: string;
}) {
  return (
    <TableRowActionsMenu label={`Open row actions for ${staffName}`}>
      <TableRowActionsMenuLink
        href={`/staff/${staffId}/edit`}
        label="Edit staff record"
        icon={Pencil}
      />
    </TableRowActionsMenu>
  );
}
