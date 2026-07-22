"use client";

import { useActionState } from "react";

import { updateTenantStatusAction } from "@/features/platform/actions/platform-actions";
import {
  INITIAL_FORM_ACTION_STATE,
  type FormActionState,
} from "@/lib/forms";
import type { TenantStatus } from "@/lib/tenants/status";
import { Button } from "@/components/ui/button";

const STATUSES: TenantStatus[] = [
  "trial",
  "active",
  "past_due",
  "suspended",
  "canceled",
];

export function TenantStatusForm({
  tenantId,
  currentStatus,
}: {
  tenantId: string;
  currentStatus: TenantStatus;
}) {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    updateTenantStatusAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Status</span>
        <select
          name="status"
          defaultValue={currentStatus}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-brand-navy focus:ring-2"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      {state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending} variant="outline" className="w-full">
        {pending ? "Saving…" : "Update status"}
      </Button>
    </form>
  );
}
