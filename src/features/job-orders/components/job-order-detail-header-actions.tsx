"use client";

import { Download, FileText, Printer, Trash2 } from "lucide-react";

import { PageHeaderActions } from "@/components/shared/page-header-actions";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuConfirm,
  TableRowActionsMenuLink,
  TableRowActionsMenuSeparator,
} from "@/components/shared/table-row-actions-menu";
import { Button } from "@/components/ui/button";
import { deleteJobOrderAction } from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderDetail } from "@/features/job-orders/types";

function openJobOrderPrint(jobOrderId: string, options?: { showPrices?: boolean }) {
  const params = new URLSearchParams({ autoprint: "1" });

  if (options?.showPrices) {
    params.set("showPrices", "1");
  }

  window.open(
    `/job-orders/${jobOrderId}/print?${params.toString()}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function JobOrderDetailHeaderActions({
  jobOrder,
  canDeleteJobOrder = false,
}: {
  jobOrder: JobOrderDetail;
  canDeleteJobOrder?: boolean;
}) {
  return (
    <PageHeaderActions
      primary={
        <Button type="button" onClick={() => openJobOrderPrint(jobOrder.id)}>
          Print Job Order
        </Button>
      }
      overflow={
        <TableRowActionsMenu label="Job order actions" variant="page">
          <TableRowActionsMenuButton
            label="Print with Prices"
            icon={Printer}
            onSelect={() => openJobOrderPrint(jobOrder.id, { showPrices: true })}
          />
          <TableRowActionsMenuLink
            href={`/api/job-orders/${jobOrder.id}/pdf?showPrices=1`}
            label="Download PDF"
            icon={Download}
          />
          {jobOrder.quotationId ? (
            <>
              <TableRowActionsMenuSeparator />
              <TableRowActionsMenuLink
                href={`/quotations/${jobOrder.quotationId}`}
                label="View Quotation"
                icon={FileText}
              />
            </>
          ) : null}
          {canDeleteJobOrder ? (
            <>
              <TableRowActionsMenuSeparator />
              <TableRowActionsMenuConfirm
                label="Delete"
                title={`Delete ${jobOrder.jobOrderNumber}?`}
                description="This job order and its line items will be removed permanently. Linked approved quotations return to pending approval."
                confirmLabel="Delete job order"
                cancelLabel="Keep job order"
                icon={Trash2}
                action={deleteJobOrderAction}
                fields={[{ name: "jobOrderId", value: jobOrder.id }]}
              />
            </>
          ) : null}
        </TableRowActionsMenu>
      }
    />
  );
}
