"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SubmitButton } from "@/components/shared/submit-button";
import { type ButtonProps } from "@/components/ui/button";
import { updatePayrollPeriodStatusAction } from "@/features/payroll/actions/payroll-actions";
import { updateSandboxPayrollPeriodStatusAction } from "@/features/sandbox/form-actions";
import { useBoundAction } from "@/features/sandbox/use-bound-action";
import type { PayrollPeriodStatus } from "@/features/payroll/types";
import { INITIAL_PAYROLL_FORM_ACTION_STATE } from "@/features/payroll/utils";

export function PayrollPeriodStatusSubmit({
  periodId,
  nextStatus,
  children,
  pendingLabel = "Updating...",
  disabled = false,
  formId,
  ...buttonProps
}: {
  periodId: string;
  nextStatus: PayrollPeriodStatus;
  children: React.ReactNode;
  pendingLabel?: string;
  disabled?: boolean;
  formId?: string;
} & Omit<ButtonProps, "type">) {
  const router = useRouter();
  const [state, formAction] = useBoundAction(
    updatePayrollPeriodStatusAction,
    updateSandboxPayrollPeriodStatusAction,
    INITIAL_PAYROLL_FORM_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    router.refresh();
  }, [router, state.status]);

  return (
    <form action={formAction} id={formId}>
      <input type="hidden" name="periodId" value={periodId} />
      <SubmitButton
        name="status"
        value={nextStatus}
        pendingLabel={pendingLabel}
        disabled={disabled}
        {...buttonProps}
      >
        {children}
      </SubmitButton>
    </form>
  );
}

export function PayrollPeriodHiddenStatusForm({
  periodId,
  nextStatus,
  formId,
}: {
  periodId: string;
  nextStatus: PayrollPeriodStatus;
  formId: string;
}) {
  const router = useRouter();
  const [state, formAction] = useBoundAction(
    updatePayrollPeriodStatusAction,
    updateSandboxPayrollPeriodStatusAction,
    INITIAL_PAYROLL_FORM_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    router.refresh();
  }, [router, state.status]);

  return (
    <form action={formAction} id={formId} className="hidden">
      <input type="hidden" name="periodId" value={periodId} />
      <button type="submit" name="status" value={nextStatus} />
    </form>
  );
}

export function submitPayrollPeriodHiddenStatusForm(formId: string) {
  const form = document.getElementById(formId) as HTMLFormElement | null;
  form?.requestSubmit();
}
