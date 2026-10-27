"use client";

import { useState } from "react";
import { Download, FileText, Printer, Trash2, X } from "lucide-react";

import { PageHeaderActions } from "@/components/shared/page-header-actions";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuConfirm,
  TableRowActionsMenuLink,
  TableRowActionsMenuSeparator,
} from "@/components/shared/table-row-actions-menu";
import { JobOrderCancelJobDialog } from "@/features/job-orders/components/job-order-cancel-job-dialog";
import { JobOrderDetailPrimaryAction } from "@/features/job-orders/components/job-order-detail-primary-action";
import { deleteJobOrderAction } from "@/features/job-orders/actions/job-order-actions";
import { deleteSandboxJobOrderAction } from "@/features/sandbox/form-actions";
import { useBoundFormAction, useSandboxOptional } from "@/features/sandbox/use-bound-action";
import type { JobOrderDetail, JobOrderDetailTab } from "@/features/job-orders/types";
import { getSimplifiedJobOrderStatus } from "@/features/job-orders/utils";

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
  redirectTab,
  canDeleteJobOrder = false,
}: {
  jobOrder: JobOrderDetail;
  redirectTab: JobOrderDetailTab;
  canDeleteJobOrder?: boolean;
}) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const sandbox = useSandboxOptional();
  const deleteAction = useBoundFormAction(deleteJobOrderAction, deleteSandboxJobOrderAction);
  const simplifiedStatus = getSimplifiedJobOrderStatus(jobOrder.status);
  const showCancelJob =
    simplifiedStatus === "in_progress" && jobOrder.canUpdateStatus;
  const showSecondaryActions =
    jobOrder.quotationId !== null || showCancelJob || canDeleteJobOrder;

  return (
    <>
      <PageHeaderActions
        primary={
          <JobOrderDetailPrimaryAction jobOrder={jobOrder} redirectTab={redirectTab} />
        }
        overflow={
          <TableRowActionsMenu label="Job order actions" variant="page">
            <TableRowActionsMenuButton
              label="Print job order"
              icon={Printer}
              onSelect={() => openJobOrderPrint(jobOrder.id)}
            />
            <TableRowActionsMenuButton
              label="Print with prices"
              icon={Printer}
              onSelect={() => openJobOrderPrint(jobOrder.id, { showPrices: true })}
            />
            {sandbox ? null : (
              <TableRowActionsMenuLink
                href={`/api/job-orders/${jobOrder.id}/pdf?showPrices=1`}
                label="Download PDF"
                icon={Download}
              />
            )}
            {showSecondaryActions ? <TableRowActionsMenuSeparator /> : null}
            {jobOrder.quotationId ? (
              <TableRowActionsMenuLink
                href={`/quotations/${jobOrder.quotationId}`}
                label="View quotation"
                icon={FileText}
              />
            ) : null}
            {showCancelJob ? (
              <TableRowActionsMenuButton
                label="Cancel job"
                icon={X}
                tone="destructive"
                onSelect={() => setCancelDialogOpen(true)}
              />
            ) : null}
            {canDeleteJobOrder ? (
              <TableRowActionsMenuConfirm
                label="Delete job order"
                title={`Delete ${jobOrder.jobOrderNumber}?`}
                description="This job order and its line items will be removed permanently. Linked approved quotations return to pending approval."
                confirmLabel="Delete job order"
                cancelLabel="Keep job order"
                icon={Trash2}
                action={deleteAction}
                fields={[{ name: "jobOrderId", value: jobOrder.id }]}
              />
            ) : null}
          </TableRowActionsMenu>
        }
      />
      {showCancelJob ? (
        <JobOrderCancelJobDialog
          jobOrderId={jobOrder.id}
          jobOrderNumber={jobOrder.jobOrderNumber}
          redirectTab={redirectTab}
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
        />
      ) : null}
    </>
  );
}
