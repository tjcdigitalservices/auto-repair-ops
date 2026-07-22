"use client";

import { Pencil } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";

export function ServiceRowActions({
  serviceId,
  serviceName,
  canManage,
}: {
  serviceId: string;
  serviceName: string;
  canManage: boolean;
}) {
  if (!canManage) {
    return <span className="text-xs text-muted-foreground">View only</span>;
  }

  return (
    <TableRowActionsMenu label={`Open row actions for ${serviceName}`}>
      <TableRowActionsMenuLink
        href={`/services/${serviceId}/edit`}
        label="Edit service"
        icon={Pencil}
      />
    </TableRowActionsMenu>
  );
}
