"use client";

import { FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { createInvoiceFromJobOrderAction } from "@/features/invoices/actions/invoice-actions";
import { createSandboxInvoiceFromJobOrderAction } from "@/features/sandbox/form-actions";
import { useBoundAction } from "@/features/sandbox/use-bound-action";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function CreateInvoiceForm({ jobOrderId }: { jobOrderId: string }) {
  const [state, formAction] = useBoundAction(
    createInvoiceFromJobOrderAction,
    createSandboxInvoiceFromJobOrderAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <FormStatusMessage message={state.message} />
      <SubmitButton>Create invoice</SubmitButton>
    </form>
  );
}
