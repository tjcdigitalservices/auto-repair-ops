"use client";

import { useActionState } from "react";

import { createBranchAction } from "@/features/settings/actions/branch-actions";
import {
  INITIAL_FORM_ACTION_STATE,
  type FormActionState,
} from "@/lib/forms";
import { Button } from "@/components/ui/button";

export function CreateBranchForm() {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    createBranchAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        <span className="font-medium text-slate-700">Code</span>
        <input
          name="code"
          required
          placeholder="NORTH"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 uppercase outline-none focus:ring-2 focus:ring-brand-navy"
        />
      </label>
      <label className="text-sm">
        <span className="font-medium text-slate-700">Name</span>
        <input
          name="name"
          required
          placeholder="North Branch"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy"
        />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Address</span>
        <input
          name="address"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy"
        />
      </label>
      <label className="text-sm">
        <span className="font-medium text-slate-700">Contact</span>
        <input
          name="contactNumber"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy"
        />
      </label>
      <label className="text-sm">
        <span className="font-medium text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy"
        />
      </label>
      {state.status === "error" ? (
        <p className="text-sm text-red-600 sm:col-span-2">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-600 sm:col-span-2">{state.message}</p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create branch"}
        </Button>
      </div>
    </form>
  );
}
