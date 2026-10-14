"use client";

import { AppLink } from "@/components/shared/app-link";
import { useEffect, useState } from "react";

import { DEFAULT_BRAND_LOGO_SRC } from "@/components/shared/brand-assets";
import { BrandLogo } from "@/components/shared/brand-logo";
import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { FormSection } from "@/components/shared/form-section";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessProfileSettingsAction } from "@/features/settings/actions/settings-actions";
import { saveSandboxBusinessProfileAction } from "@/features/sandbox/form-actions";
import { useBoundAction } from "@/features/sandbox/use-bound-action";
import { BUSINESS_LOGO_MAX_FILE_SIZE_MB } from "@/features/settings/constants";
import type { BusinessSettingsValues } from "@/features/settings/types";
import { DEFAULT_BRAND_PACK } from "@/lib/branding/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

function revokePreviewUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function BusinessProfileForm({
  initialValues,
}: {
  initialValues: BusinessSettingsValues;
}) {
  const [state, formAction] = useBoundAction(
    updateBusinessProfileSettingsAction,
    saveSandboxBusinessProfileAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues({
    businessName: initialValues.businessName,
    businessContact: initialValues.businessContact,
    businessEmail: initialValues.businessEmail,
    businessVatRegistrationNo: initialValues.businessVatRegistrationNo,
    businessAddress: initialValues.businessAddress,
    defaultTaxRate: initialValues.defaultTaxRate,
    receiptFooter: initialValues.receiptFooter,
  });
  const [logoFilePreviewUrl, setLogoFilePreviewUrl] = useState<string | null>(null);
  const [markFilePreviewUrl, setMarkFilePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      revokePreviewUrl(logoFilePreviewUrl);
    };
  }, [logoFilePreviewUrl]);

  useEffect(() => {
    return () => {
      revokePreviewUrl(markFilePreviewUrl);
    };
  }, [markFilePreviewUrl]);

  useEffect(() => {
    setLogoFilePreviewUrl(null);
  }, [initialValues.businessLogoUrl]);

  useEffect(() => {
    setMarkFilePreviewUrl(null);
  }, [initialValues.businessMarkUrl]);

  const logoPreviewSrc =
    logoFilePreviewUrl ?? initialValues.businessLogoUrl ?? DEFAULT_BRAND_LOGO_SRC;
  const markPreviewSrc =
    markFilePreviewUrl ?? initialValues.businessMarkUrl ?? DEFAULT_BRAND_PACK.markSrc;

  return (
    <FormSection
      title="Business profile"
      description="Values used on invoices, POS receipts, and printed shop documents."
    >
      <form action={formAction} className="space-y-5">
        <FormRequiredFieldsNote />
        <FormStatusMessage message={state.message} />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Main logo</p>
              <p className="text-xs text-muted-foreground">
                Full wordmark with text (e.g. brand name + icon). Used on
                receipts, documents, and the sidebar.
              </p>
            </div>
            <div className="flex h-[104px] items-center justify-center rounded-xl border border-border/70 bg-muted/15 px-4 py-3">
              <BrandLogo
                src={logoPreviewSrc}
                alt={logoFilePreviewUrl ? "Selected business logo preview" : "Current business logo"}
                width={240}
                height={120}
                className="max-h-[72px] max-w-full"
                unoptimized
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessLogo" optional>
                Replace logo
              </Label>
              <Input
                id="businessLogo"
                name="businessLogo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setLogoFilePreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP, or SVG up to {BUSINESS_LOGO_MAX_FILE_SIZE_MB} MB.
                After upload, pick button colors in the{" "}
                <AppLink
                  href="/settings?tab=theme"
                  className="font-medium text-brand-navy underline-offset-2 hover:underline"
                >
                  Theme colors
                </AppLink>{" "}
                tab.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Brand icon</p>
              <p className="text-xs text-muted-foreground">
                Standalone mark without text (e.g. shield only). Used on login
                and as the browser favicon.
              </p>
            </div>
            <div className="flex h-[104px] items-center justify-center rounded-xl border border-border/70 bg-muted/15 px-4 py-3">
              <BrandLogo
                src={markPreviewSrc}
                alt={markFilePreviewUrl ? "Selected brand icon preview" : "Current brand icon"}
                width={96}
                height={96}
                className="max-h-[72px] max-w-[72px]"
                unoptimized
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessMark" optional>
                Replace icon
              </Label>
              <Input
                id="businessMark"
                name="businessMark"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setMarkFilePreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Square PNG, JPG, WebP, or SVG up to{" "}
                {BUSINESS_LOGO_MAX_FILE_SIZE_MB} MB works best. Uploading also
                scans colors for the{" "}
                <AppLink
                  href="/settings?tab=theme"
                  className="font-medium text-brand-navy underline-offset-2 hover:underline"
                >
                  Theme colors
                </AppLink>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName" required>
              Business name
            </Label>
            <Input
              id="businessName"
              name="businessName"
              value={values.businessName}
              onChange={(event) => updateFormValue("businessName", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "businessName")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "businessName",
                required: true,
                errorId: fieldErrorId("businessName"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="businessName" id={fieldErrorId("businessName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessContact" optional>Business contact</Label>
            <Input
              id="businessContact"
              name="businessContact"
              value={values.businessContact}
              className={fieldControlClassName(state.fieldErrors, "businessContact")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "businessContact",
                required: false,
                errorId: fieldErrorId("businessContact"),
              })}
              onChange={(event) => updateFormValue("businessContact", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="businessContact" id={fieldErrorId("businessContact")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessVatRegistrationNo" optional>VAT registration no.</Label>
          <Input
            id="businessVatRegistrationNo"
            name="businessVatRegistrationNo"
            value={values.businessVatRegistrationNo}
            className={fieldControlClassName(state.fieldErrors, "businessVatRegistrationNo")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "businessVatRegistrationNo",
              required: false,
              errorId: fieldErrorId("businessVatRegistrationNo"),
            })}
            onChange={(event) => updateFormValue("businessVatRegistrationNo", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="businessVatRegistrationNo" id={fieldErrorId("businessVatRegistrationNo")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessEmail" optional>Business email</Label>
          <Input
            id="businessEmail"
            name="businessEmail"
            type="email"
            value={values.businessEmail}
            onChange={(event) => updateFormValue("businessEmail", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "businessEmail")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "businessEmail",
              errorId: fieldErrorId("businessEmail"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="businessEmail" id={fieldErrorId("businessEmail")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessAddress" optional>Business address</Label>
          <Textarea
            id="businessAddress"
            name="businessAddress"
            value={values.businessAddress}
            className={fieldControlClassName(state.fieldErrors, "businessAddress")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "businessAddress",
              required: false,
              errorId: fieldErrorId("businessAddress"),
            })}
            onChange={(event) => updateFormValue("businessAddress", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="businessAddress" id={fieldErrorId("businessAddress")} />
        </div>

        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="defaultTaxRate" required>
              Default tax rate (%)
            </Label>
            <Input
              id="defaultTaxRate"
              name="defaultTaxRate"
              inputMode="decimal"
              value={values.defaultTaxRate}
              onChange={(event) => updateFormValue("defaultTaxRate", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "defaultTaxRate")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "defaultTaxRate",
                required: true,
                errorId: fieldErrorId("defaultTaxRate"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="defaultTaxRate" id={fieldErrorId("defaultTaxRate")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptFooter" optional>Receipt footer</Label>
            <Textarea
              id="receiptFooter"
              name="receiptFooter"
              value={values.receiptFooter}
              className={fieldControlClassName(state.fieldErrors, "receiptFooter")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "receiptFooter",
                required: false,
                errorId: fieldErrorId("receiptFooter"),
              })}
              onChange={(event) => updateFormValue("receiptFooter", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="receiptFooter" id={fieldErrorId("receiptFooter")} />
          </div>
        </div>

        <SubmitButton pendingLabel="Saving...">Save business profile</SubmitButton>
      </form>
    </FormSection>
  );
}
