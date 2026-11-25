"use client";

import { useActionState, useEffect } from "react";

import { updateTenantDetailsAction } from "@/features/platform/actions/platform-actions";
import {
  INITIAL_FORM_ACTION_STATE,
  type FormActionState,
} from "@/lib/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TenantEditForm({
  tenantId,
  initialName,
  initialCurrencyCode,
  initialTimezone,
  slug,
  onSuccess,
  onCancel,
}: {
  tenantId: string;
  initialName: string;
  initialCurrencyCode: string;
  initialTimezone: string;
  slug: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    updateTenantDetailsAction,
    INITIAL_FORM_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="tenantId" value={tenantId} />

      <div className="space-y-2">
        <Label htmlFor="edit-tenant-name" required>
          Shop name
        </Label>
        <Input
          id="edit-tenant-name"
          name="name"
          required
          defaultValue={initialName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-tenant-slug">Tenant slug</Label>
        <Input id="edit-tenant-slug" value={slug} disabled readOnly />
        <p className="text-xs text-slate-500">
          Slug is permanent after provisioning to keep public and login URLs stable.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="edit-tenant-currency" required>
            Currency
          </Label>
          <Input
            id="edit-tenant-currency"
            name="currencyCode"
            required
            defaultValue={initialCurrencyCode}
            maxLength={3}
            className="uppercase"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-tenant-timezone" required>
            Time zone
          </Label>
          <Input
            id="edit-tenant-timezone"
            name="timezone"
            required
            defaultValue={initialTimezone}
            placeholder="Asia/Manila"
          />
        </div>
      </div>

      {state.status === "error" ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-700">{state.message}</p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="bluePrimary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
