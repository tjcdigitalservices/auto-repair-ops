"use client";

import { Pencil } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";

export function SupplierRowActions({
  supplierId,
  supplierName,
}: {
  supplierId: string;
  supplierName: string;
}) {
  return (
    <TableRowActionsMenu label={`Open row actions for ${supplierName}`}>
      <TableRowActionsMenuLink
        href={`/suppliers/${supplierId}/edit`}
        label="Edit supplier"
        icon={Pencil}
      />
    </TableRowActionsMenu>
  );
}
