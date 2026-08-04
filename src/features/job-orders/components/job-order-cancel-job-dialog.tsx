"use client";

import { useActionState, useState } from "react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import {
  FieldError,
  FormStatusMessage,
} from "@/components/shared/form-status";
import { Textarea } from "@/components/ui/textarea";
import { updateJobOrderStatusAction } from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderDetailTab } from "@/features/job-orders/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function JobOrderCancelJobDialog({
  jobOrderId,
  jobOrderNumber,
  redirectTab,
  open,
  onOpenChange,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
  redirectTab: JobOrderDetailTab;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <JobOrderCancelJobDialogForm
      key={instanceKey}
      jobOrderId={jobOrderId}
      jobOrderNumber={jobOrderNumber}
      redirectTab={redirectTab}
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
          setInstanceKey((current) => current + 1);
        }
      }}
    />
  );
}

function JobOrderCancelJobDialogForm({
  jobOrderId,
  jobOrderNumber,
  redirectTab,
  open,
  onOpenChange,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
  redirectTab: JobOrderDetailTab;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(
    updateJobOrderStatusAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [cancellationReason, setCancellationReason] = useState("");

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Cancel ${jobOrderNumber}?`}
      description="This will end the job order without releasing the vehicle."
      action={formAction}
      fields={[
        { name: "jobOrderId", value: jobOrderId },
        { name: "nextStatus", value: "cancelled" },
        { name: "redirectTab", value: redirectTab },
      ]}
      confirmLabel="Cancel Job"
      cancelLabel="Keep Job"
      closeOnSubmit={false}
    >
      <FormStatusMessage message={state.message} />
      <div className="space-y-2">
        <label
          htmlFor={`job-order-cancel-reason-${jobOrderId}`}
          className="text-sm font-semibold text-foreground"
        >
          Reason (optional)
        </label>
        <Textarea
          id={`job-order-cancel-reason-${jobOrderId}`}
          name="cancellationReason"
          value={cancellationReason}
          onChange={(event) => setCancellationReason(event.target.value)}
          placeholder="Add a short cancellation note for the audit trail."
          rows={4}
        />
        <FieldError errors={state.fieldErrors} name="cancellationReason" />
      </div>
    </ConfirmActionDialog>
  );
}
