"use client";

import { Pencil } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";

export function ProductRowActions({
  productId,
  productName,
  canManage,
}: {
  productId: string;
  productName: string;
  canManage: boolean;
}) {
  if (!canManage) {
    return <span className="text-xs text-muted-foreground">View only</span>;
  }

  return (
    <TableRowActionsMenu label={`Open row actions for ${productName}`}>
      <TableRowActionsMenuLink
        href={`/products/${productId}/edit`}
        label="Edit product"
        icon={Pencil}
      />
    </TableRowActionsMenu>
  );
}
