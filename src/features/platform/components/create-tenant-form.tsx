"use client";

import { useActionState } from "react";

import { createTenantAction } from "@/features/platform/actions/platform-actions";
import {
  INITIAL_FORM_ACTION_STATE,
  type FormActionState,
} from "@/lib/forms";
import { Button } from "@/components/ui/button";

export function CreateTenantForm() {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    createTenantAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-4">
      <Field label="Shop name" name="name" required placeholder="Acme Auto Care" />
      <Field
        label="Slug"
        name="slug"
        required
        placeholder="acme"
        hint="Used in /t/acme and optional subdomain"
      />
      <Field label="Owner email" name="ownerEmail" type="email" placeholder="owner@acme.com" />
      <Field
        label="Owner password"
        name="ownerPassword"
        type="password"
        placeholder="Min 8 characters"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner first name" name="ownerFirstName" placeholder="Owner" />
        <Field label="Owner last name" name="ownerLastName" placeholder="Account" />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create tenant"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-brand-navy focus:ring-2"
      />
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
