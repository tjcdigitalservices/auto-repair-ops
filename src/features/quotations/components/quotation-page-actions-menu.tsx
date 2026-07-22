"use client";

import { FileDown, FileUp, Globe, Printer } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";

export function QuotationPageActionsMenu() {
  return (
    <TableRowActionsMenu label="Quotation actions" variant="page">
      <TableRowActionsMenuLink
        href="/quotations/website-requests"
        label="Website Leads"
        icon={Globe}
      />
      <TableRowActionsMenuButton
        label="Import Quotations"
        icon={FileUp}
        onSelect={() => undefined}
        disabled
      />
      <TableRowActionsMenuButton
        label="Export Quotations"
        icon={FileDown}
        onSelect={() => undefined}
        disabled
      />
      <TableRowActionsMenuButton
        label="Print List"
        icon={Printer}
        onSelect={() => undefined}
        disabled
      />
    </TableRowActionsMenu>
  );
}
