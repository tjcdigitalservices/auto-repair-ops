"use client";

import { useActionState, useState } from "react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { updateJobOrderStatusAction } from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderDetail, JobOrderDetailTab } from "@/features/job-orders/types";
import {
  getJobOrderPrimaryActionConfig,
  getSimplifiedJobOrderStatus,
} from "@/features/job-orders/utils";
import { releaseJobOrderVehicleAction } from "@/features/invoices/actions/invoice-actions";
import { createInvoiceFromJobOrderAction } from "@/features/invoices/actions/invoice-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function JobOrderDetailPrimaryAction({
  jobOrder,
  redirectTab,
}: {
  jobOrder: JobOrderDetail;
  redirectTab: JobOrderDetailTab;
}) {
  const simplifiedStatus = getSimplifiedJobOrderStatus(jobOrder.status);
  const primaryActionConfig = getJobOrderPrimaryActionConfig(
    simplifiedStatus,
    jobOrder.canUpdateStatus,
  );

  if (primaryActionConfig) {
    return (
      <JobOrderStatusPrimaryActionForm
        jobOrderId={jobOrder.id}
        redirectTab={redirectTab}
        actionConfig={primaryActionConfig}
      />
    );
  }

  if (jobOrder.canGenerateInvoice) {
    return <CreateInvoicePrimaryAction jobOrderId={jobOrder.id} />;
  }

  if (simplifiedStatus === "completed" && jobOrder.canReleaseVehicle) {
    return (
      <ReleaseJobOrderVehicleDialog
        jobOrderId={jobOrder.id}
        jobOrderNumber={jobOrder.jobOrderNumber}
      />
    );
  }

  return null;
}

function JobOrderStatusPrimaryActionForm({
  jobOrderId,
  redirectTab,
  actionConfig,
}: {
  jobOrderId: string;
  redirectTab: JobOrderDetailTab;
  actionConfig: NonNullable<ReturnType<typeof getJobOrderPrimaryActionConfig>>;
}) {
  const [, formAction] = useActionState(
    updateJobOrderStatusAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <input type="hidden" name="redirectTab" value={redirectTab} />
      <input type="hidden" name="nextStatus" value={actionConfig.nextStatus} />
      <input type="hidden" name="cancellationReason" value="" />
      <SubmitButton variant="navyPrimary" pendingLabel={actionConfig.pendingLabel}>
        {actionConfig.label}
      </SubmitButton>
    </form>
  );
}

function CreateInvoicePrimaryAction({ jobOrderId }: { jobOrderId: string }) {
  const [, formAction] = useActionState(
    createInvoiceFromJobOrderAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <SubmitButton variant="navyPrimary" pendingLabel="Creating invoice...">
        Create Invoice
      </SubmitButton>
    </form>
  );
}

function ReleaseJobOrderVehicleDialog({
  jobOrderId,
  jobOrderNumber,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <ReleaseJobOrderVehicleDialogForm
      key={instanceKey}
      jobOrderId={jobOrderId}
      jobOrderNumber={jobOrderNumber}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setInstanceKey((current) => current + 1);
        }
      }}
    />
  );
}

function ReleaseJobOrderVehicleDialogForm({
  jobOrderId,
  jobOrderNumber,
  open,
  onOpenChange,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(
    releaseJobOrderVehicleAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={({ openDialog }) => (
        <Button type="button" variant="navyPrimary" onClick={openDialog}>
          Release Vehicle
        </Button>
      )}
      title={`Release ${jobOrderNumber}?`}
      description="This will mark the vehicle as released to the customer."
      action={formAction}
      fields={[{ name: "jobOrderId", value: jobOrderId }]}
      confirmLabel="Release Vehicle"
      confirmVariant="navyPrimary"
      closeOnSubmit={false}
    >
      <FormStatusMessage message={state.message} />
    </ConfirmActionDialog>
  );
}
