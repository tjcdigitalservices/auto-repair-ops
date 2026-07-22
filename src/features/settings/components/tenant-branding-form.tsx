"use client";

import { useActionState } from "react";

import { updateTenantBrandingAction } from "@/features/settings/actions/branding-actions";
import type { ResolvedTenantBranding } from "@/lib/branding/types";
import {
  INITIAL_FORM_ACTION_STATE,
  type FormActionState,
} from "@/lib/forms";
import { Button } from "@/components/ui/button";

export function TenantBrandingForm({ branding }: { branding: ResolvedTenantBranding }) {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    updateTenantBrandingAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="App name" name="appName" defaultValue={branding.appName} required />
      <Field label="Company name" name="companyName" defaultValue={branding.companyName} required />
      <Field label="Support email" name="supportEmail" defaultValue={branding.supportEmail ?? ""} type="email" />
      <Field label="Phone" name="phone" defaultValue={branding.phone ?? ""} />
      <Field label="Address" name="address" defaultValue={branding.address ?? ""} className="sm:col-span-2" />
      <Field label="Primary color (HSL)" name="primaryColor" defaultValue={branding.primaryColor} required />
      <Field label="Accent color (HSL)" name="accentColor" defaultValue={branding.accentColor} required />
      <Field label="Tagline" name="tagline" defaultValue={branding.tagline} className="sm:col-span-2" />
      <Field label="Meta title" name="metaTitle" defaultValue={branding.metaTitle} />
      <Field label="Meta description" name="metaDescription" defaultValue={branding.metaDescription} />
      <Field label="Website URL" name="websiteUrl" defaultValue={branding.websiteUrl ?? ""} />
      <Field label="Facebook URL" name="facebookUrl" defaultValue={branding.facebookUrl ?? ""} />
      <Field label="Facebook label" name="facebookLabel" defaultValue={branding.facebookLabel ?? ""} />
      <Field label="Maps URL" name="mapsUrl" defaultValue={branding.mapsUrl ?? ""} />
      <Field label="Google reviews URL" name="googleReviewsUrl" defaultValue={branding.googleReviewsUrl ?? ""} className="sm:col-span-2" />
      <Field label="Logo path" name="logoPath" defaultValue={branding.logoSrc} />
      <Field label="Tight logo path" name="logoTightPath" defaultValue={branding.logoTightSrc} />
      <Field label="Mark path" name="markPath" defaultValue={branding.markSrc} />
      <Field label="Favicon path" name="faviconPath" defaultValue={branding.faviconSrc} />
      <Field label="Login background" name="loginBackgroundPath" defaultValue={branding.loginBackgroundSrc} />
      <Field label="Hero background" name="heroBackgroundPath" defaultValue={branding.heroBackgroundSrc} />
      <Field label="Feature background" name="featureBackgroundPath" defaultValue={branding.featureBackgroundSrc} className="sm:col-span-2" />
      <Field label="Receipt footer default" name="receiptFooterDefault" defaultValue={branding.receiptFooterDefault} className="sm:col-span-2" />

      {state.status === "error" ? (
        <p className="text-sm text-red-600 sm:col-span-2">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-600 sm:col-span-2">{state.message}</p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save branding"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  className,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`text-sm ${className ?? ""}`}>
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy"
      />
    </label>
  );
}
