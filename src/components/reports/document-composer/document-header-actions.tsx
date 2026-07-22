"use client";

import { Download, FileOutput, Printer } from "lucide-react";

import {
  PageHeaderActions,
} from "@/components/shared/page-header-actions";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import { Button } from "@/components/ui/button";

export function DocumentHeaderActions({
  onPrint,
  overflow,
}: {
  onPrint: () => void;
  overflow?: React.ReactNode;
}) {
  return (
    <PageHeaderActions
      primary={
        <Button type="button" variant="bluePrimary" onClick={onPrint}>
          <Printer className="size-4" />
          Print
        </Button>
      }
      overflow={
        <TableRowActionsMenu label="Document actions" variant="page">
          <TableRowActionsMenuButton
            label="Export PDF"
            icon={FileOutput}
            onSelect={() => undefined}
            disabled
          />
          <TableRowActionsMenuButton
            label="Download PDF"
            icon={Download}
            onSelect={() => undefined}
            disabled
          />
          {overflow}
        </TableRowActionsMenu>
      }
    />
  );
}
