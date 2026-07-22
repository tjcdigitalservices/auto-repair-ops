"use client";

import { Eye } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";

export function InvoiceRowActions({
  invoiceId,
  invoiceNumber,
}: {
  invoiceId: string;
  invoiceNumber: string;
}) {
  return (
    <TableRowActionsMenu label={`Open row actions for invoice ${invoiceNumber}`}>
      <TableRowActionsMenuLink
        href={`/invoices/${invoiceId}`}
        label="View invoice"
        icon={Eye}
      />
    </TableRowActionsMenu>
  );
}
