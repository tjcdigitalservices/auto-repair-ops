"use client";

import { Eye } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";

export function PayrollPeriodRowActions({
  periodId,
  periodLabel,
}: {
  periodId: string;
  periodLabel: string;
}) {
  return (
    <TableRowActionsMenu label={`Open row actions for ${periodLabel}`}>
      <TableRowActionsMenuLink
        href={`/payroll/${periodId}`}
        label="Open payroll period"
        icon={Eye}
      />
    </TableRowActionsMenu>
  );
}
