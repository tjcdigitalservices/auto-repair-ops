"use client";

import { useActionState } from "react";

import { FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { migrateMechanicPortalLoginAction } from "@/features/staff/actions/staff-actions";
import { StaffPortalLoginSuccess } from "@/features/staff/components/staff-portal-login-success";
import { INITIAL_STAFF_ACTION_STATE } from "@/features/staff/types";

export function StaffPortalLoginDomainFix({
  staffId,
  staffName,
  currentUsername,
  portalEmailDomain,
}: {
  staffId: string;
  staffName: string;
  currentUsername: string;
  portalEmailDomain: string;
}) {
  const [state, formAction] = useActionState(
    migrateMechanicPortalLoginAction,
    INITIAL_STAFF_ACTION_STATE,
  );

  if (state.portalLogin) {
    return (
      <StaffPortalLoginSuccess
        staffName={state.portalLogin.staffName}
        username={state.portalLogin.username}
        temporaryPassword={state.portalLogin.temporaryPassword}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-4">
      <input type="hidden" name="staffId" value={staffId} />
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Legacy portal domain detected</p>
        <p className="text-sm text-muted-foreground">
          {currentUsername} does not match this tenant&apos;s portal domain (@{portalEmailDomain}).
          Update the login to use the current tenant username and reset the temporary password.
        </p>
      </div>
      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />
      <SubmitButton pendingLabel="Updating...">Update portal username</SubmitButton>
    </form>
  );
}
