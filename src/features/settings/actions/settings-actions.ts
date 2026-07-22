"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { getBranchScopedServerClient } from "@/lib/branches";
import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import {
  BUSINESS_ASSETS_BUCKET,
  buildBusinessLogoObjectKey,
  buildBusinessMarkObjectKey,
} from "@/lib/constants/storage";
import {
  businessProfileSettingsSchema,
  documentSequenceSettingsSchema,
  operationalRulesSettingsSchema,
  parseBusinessProfileSettingsFormData,
  parseDocumentSequenceSettingsFormData,
  parseOperationalRulesSettingsFormData,
  parsePublicPresenceSettingsFormData,
  publicPresenceSettingsSchema,
  parseThemeColorsSettingsFormData,
  themeColorsSettingsSchema,
} from "@/features/settings/schemas/settings-forms";
import { parseStoreHoursFormData } from "@/features/settings/store-hours";
import {
  BUSINESS_LOGO_MAX_FILE_SIZE_BYTES,
  BUSINESS_LOGO_MAX_FILE_SIZE_MB,
} from "@/features/settings/constants";

export async function updateBusinessProfileSettingsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = businessProfileSettingsSchema.safeParse(
    parseBusinessProfileSettingsFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const { data: currentSettings, error: currentError } = await supabase
    .from("business_settings")
    .select("*")
    .eq("branch_id", branchId)
    .single();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const businessLogoFile = readFile(formData, "businessLogo");
  const businessMarkFile = readFile(formData, "businessMark");
  let businessLogoPath = currentSettings.business_logo_path as string | null;
  let businessMarkPath = (currentSettings.business_mark_path as string | null) ?? null;
  let derivedPalette: Awaited<
    ReturnType<
      typeof import("@/lib/branding/extract-logo-palette")["deriveBrandPaletteFromLogo"]
    >
  > = null;

  if (businessLogoFile) {
    const fileValidationError = validateBrandImageFile(businessLogoFile, "logo");

    if (fileValidationError) {
      return { status: "error", message: fileValidationError };
    }

    const logoBytes = Buffer.from(await businessLogoFile.arrayBuffer());
    const { deriveBrandPaletteFromLogo } = await import(
      "@/lib/branding/extract-logo-palette"
    );
    derivedPalette = await deriveBrandPaletteFromLogo(logoBytes);

    const uploadPath = buildBusinessLogoObjectKey(context.tenantId, branchId, businessLogoFile.name);
    const { error: uploadError } = await supabase.storage
      .from(BUSINESS_ASSETS_BUCKET)
      .upload(uploadPath, logoBytes, {
        contentType: businessLogoFile.type,
        upsert: true,
      });

    if (uploadError) {
      return { status: "error", message: uploadError.message };
    }

    businessLogoPath = uploadPath;
  }

  if (businessMarkFile) {
    const fileValidationError = validateBrandImageFile(businessMarkFile, "icon");

    if (fileValidationError) {
      return { status: "error", message: fileValidationError };
    }

    const markBytes = Buffer.from(await businessMarkFile.arrayBuffer());
    const { deriveBrandPaletteFromLogo } = await import(
      "@/lib/branding/extract-logo-palette"
    );
    // Prefer the icon for theme colors — marks are usually cleaner brand hues.
    derivedPalette = await deriveBrandPaletteFromLogo(markBytes);

    const uploadPath = buildBusinessMarkObjectKey(
      context.tenantId,
      branchId,
      businessMarkFile.name,
    );
    const { error: uploadError } = await supabase.storage
      .from(BUSINESS_ASSETS_BUCKET)
      .upload(uploadPath, markBytes, {
        contentType: businessMarkFile.type,
        upsert: true,
      });

    if (uploadError) {
      return { status: "error", message: uploadError.message };
    }

    businessMarkPath = uploadPath;
  }

  const payload = {
    business_name: parsed.data.businessName,
    business_logo_path: businessLogoPath,
    business_mark_path: businessMarkPath,
    business_address: normalizeNullable(parsed.data.businessAddress),
    business_contact: normalizeNullable(parsed.data.businessContact),
    business_email: normalizeNullable(parsed.data.businessEmail),
    business_vat_registration_no: normalizeNullable(parsed.data.businessVatRegistrationNo),
    receipt_footer: normalizeNullable(parsed.data.receiptFooter),
    default_tax_rate: Number(parsed.data.defaultTaxRate),
  };

  const { error } = await supabase
    .from("business_settings")
    .update(payload)
    .eq("branch_id", branchId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(supabase, {
    action: "Updated business profile settings",
    entityType: "business_settings",
    entityId: String(currentSettings.id),
    userId: context.userId,
    beforeData: {
      business_name: currentSettings.business_name,
      business_logo_path: currentSettings.business_logo_path,
      business_mark_path: currentSettings.business_mark_path ?? null,
      business_address: currentSettings.business_address,
      business_contact: currentSettings.business_contact,
      business_email: currentSettings.business_email,
      business_vat_registration_no: currentSettings.business_vat_registration_no,
      receipt_footer: currentSettings.receipt_footer,
      default_tax_rate: currentSettings.default_tax_rate,
    },
    afterData: payload,
  });

  // Keep login/public tenant branding in sync with logo + icon uploads.
  if (
    businessLogoPath ||
    businessMarkPath ||
    parsed.data.businessName ||
    derivedPalette
  ) {
    const brandingPatch: {
      company_name: string;
      app_name: string;
      logo_path?: string;
      logo_tight_path?: string;
      mark_path?: string;
      favicon_path?: string;
      primary_color?: string;
      primary_color_strong?: string;
      primary_color_hover?: string;
      accent_color?: string;
      accent_color_dark?: string;
      soft_color?: string;
      border_color?: string;
    } = {
      company_name: parsed.data.businessName,
      app_name: parsed.data.businessName,
    };

    if (businessLogoFile && businessLogoPath) {
      brandingPatch.logo_path = businessLogoPath;
      brandingPatch.logo_tight_path = businessLogoPath;
    }

    if (businessMarkFile && businessMarkPath) {
      brandingPatch.mark_path = businessMarkPath;
      brandingPatch.favicon_path = businessMarkPath;
    }

    if (derivedPalette) {
      brandingPatch.primary_color = derivedPalette.primaryColor;
      brandingPatch.primary_color_strong = derivedPalette.primaryColorStrong;
      brandingPatch.primary_color_hover = derivedPalette.primaryColorHover;
      brandingPatch.accent_color = derivedPalette.accentColor;
      brandingPatch.accent_color_dark = derivedPalette.accentColorDark;
      brandingPatch.soft_color = derivedPalette.softColor;
      brandingPatch.border_color = derivedPalette.borderColor;
    }

    const { error: brandingError } = await supabase
      .from("tenant_branding")
      .update(brandingPatch)
      .eq("tenant_id", context.tenantId);

    if (brandingError) {
      return { status: "error", message: brandingError.message };
    }
  }

  revalidateSettingsPaths();
  redirect("/settings");
}

export async function updatePublicPresenceSettingsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = publicPresenceSettingsSchema.safeParse(
    parsePublicPresenceSettingsFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { context, supabase } = await getBranchScopedServerClient("settings:write");
  const storeHours = parseStoreHoursFormData(formData);

  const payload = {
    website_url: normalizeNullable(parsed.data.websiteUrl),
    facebook_url: normalizeNullable(parsed.data.facebookUrl),
    facebook_label: normalizeNullable(parsed.data.facebookLabel),
    store_hours: storeHours,
  };

  const { data: currentBranding, error: currentError } = await supabase
    .from("tenant_branding")
    .select("website_url, facebook_url, facebook_label, store_hours")
    .eq("tenant_id", context.tenantId)
    .maybeSingle();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const { error } = await supabase
    .from("tenant_branding")
    .update(payload)
    .eq("tenant_id", context.tenantId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(supabase, {
    action: "Updated public presence settings",
    entityType: "tenant_branding",
    entityId: context.tenantId,
    userId: context.userId,
    beforeData: {
      website_url: currentBranding?.website_url ?? null,
      facebook_url: currentBranding?.facebook_url ?? null,
      facebook_label: currentBranding?.facebook_label ?? null,
      store_hours: currentBranding?.store_hours ?? null,
    },
    afterData: payload,
  });

  revalidateSettingsPaths();
  revalidatePath("/contact");
  return { status: "success", message: "Public presence settings saved." };
}

export async function updateThemeColorsSettingsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = themeColorsSettingsSchema.safeParse(
    parseThemeColorsSettingsFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { buildBrandPaletteFromSeeds } = await import(
    "@/lib/branding/extract-logo-palette"
  );
  const palette = buildBrandPaletteFromSeeds(
    parsed.data.buttonColor,
    parsed.data.accentColor,
  );

  if (!palette) {
    return {
      status: "error",
      message: "Could not apply the selected theme colors.",
    };
  }

  const { context, supabase } = await getBranchScopedServerClient("settings:write");
  const payload = {
    primary_color: palette.primaryColor,
    primary_color_strong: palette.primaryColorStrong,
    primary_color_hover: palette.primaryColorHover,
    accent_color: palette.accentColor,
    accent_color_dark: palette.accentColorDark,
    soft_color: palette.softColor,
    border_color: palette.borderColor,
  };

  const { data: currentBranding, error: currentError } = await supabase
    .from("tenant_branding")
    .select(
      "primary_color, primary_color_strong, primary_color_hover, accent_color, accent_color_dark, soft_color, border_color",
    )
    .eq("tenant_id", context.tenantId)
    .maybeSingle();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const { error } = await supabase
    .from("tenant_branding")
    .update(payload)
    .eq("tenant_id", context.tenantId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(supabase, {
    action: "Updated theme colors",
    entityType: "tenant_branding",
    entityId: context.tenantId,
    userId: context.userId,
    beforeData: currentBranding ?? null,
    afterData: payload,
  });

  revalidateSettingsPaths();
  return { status: "success", message: "Theme colors saved." };
}

export async function updateOperationalRulesSettingsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = operationalRulesSettingsSchema.safeParse(
    parseOperationalRulesSettingsFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const { data: currentSettings, error: currentError } = await supabase
    .from("business_settings")
    .select("*")
    .eq("branch_id", branchId)
    .single();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const payload = {
    allow_global_product_catalog: parsed.data.allowGlobalProductCatalog,
    allow_global_service_catalog: parsed.data.allowGlobalServiceCatalog,
    allow_partial_payments: parsed.data.allowPartialPayments,
    require_invoice_before_job_completion:
      parsed.data.requireInvoiceBeforeJobCompletion,
    require_invoice_before_vehicle_release:
      parsed.data.requireInvoiceBeforeVehicleRelease,
    allow_release_with_balance: parsed.data.allowReleaseWithBalance,
    require_full_payment_before_release: parsed.data.requireFullPaymentBeforeRelease,
    require_additional_item_preapproval: parsed.data.requireAdditionalItemPreApproval,
    enable_barcode_support: parsed.data.enableBarcodeSupport,
    enable_shelf_location: parsed.data.enableShelfLocation,
    payroll_standard_daily_hours: Number(parsed.data.payrollStandardDailyHours),
    payroll_holiday_premium_rate: Number(parsed.data.payrollHolidayPremiumRate) / 100,
  };

  const { error } = await supabase
    .from("business_settings")
    .update(payload)
    .eq("branch_id", branchId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(supabase, {
    action: "Updated operational rules",
    entityType: "business_settings",
    entityId: String(currentSettings.id),
    userId: context.userId,
    beforeData: {
      allow_global_product_catalog: currentSettings.allow_global_product_catalog,
      allow_global_service_catalog: currentSettings.allow_global_service_catalog,
      allow_partial_payments: currentSettings.allow_partial_payments,
      require_invoice_before_job_completion:
        currentSettings.require_invoice_before_job_completion,
      require_invoice_before_vehicle_release:
        currentSettings.require_invoice_before_vehicle_release,
      allow_release_with_balance: currentSettings.allow_release_with_balance,
      require_full_payment_before_release:
        currentSettings.require_full_payment_before_release,
      require_additional_item_preapproval:
        currentSettings.require_additional_item_preapproval,
      enable_barcode_support: currentSettings.enable_barcode_support,
      enable_shelf_location: currentSettings.enable_shelf_location,
      payroll_standard_daily_hours: currentSettings.payroll_standard_daily_hours,
      payroll_holiday_premium_rate: currentSettings.payroll_holiday_premium_rate,
    },
    afterData: payload,
  });

  revalidateSettingsPaths();
  redirect("/settings");
}

export async function updateDocumentSequenceSettingsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = documentSequenceSettingsSchema.safeParse(
    parseDocumentSequenceSettingsFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const { data: currentSequence, error: currentError } = await supabase
    .from("document_sequences")
    .select("*")
    .eq("key", parsed.data.key)
    .eq("branch_id", branchId)
    .single();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const payload = {
    prefix: parsed.data.prefix.trim(),
    padding: Number(parsed.data.padding),
    last_value: Number(parsed.data.lastValue),
  };

  const { error } = await supabase
    .from("document_sequences")
    .update(payload)
    .eq("key", parsed.data.key)
    .eq("branch_id", branchId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(supabase, {
    action: `Updated document sequence: ${parsed.data.key}`,
    entityType: "document_sequence",
    userId: context.userId,
    beforeData: {
      key: currentSequence.key,
      branch_id: currentSequence.branch_id,
      prefix: currentSequence.prefix,
      padding: currentSequence.padding,
      last_value: currentSequence.last_value,
    },
    afterData: {
      key: parsed.data.key,
      branch_id: branchId,
      ...payload,
    },
  });

  revalidateSettingsPaths();
  redirect("/settings");
}

function revalidateSettingsPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/login");
  revalidatePath("/reports");
  revalidatePath("/quotations");
  revalidatePath("/job-orders");
  revalidatePath("/invoices");
  revalidatePath("/payments");
  revalidatePath("/pos");
  revalidatePath("/inventory");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);

  return value instanceof File && value.size > 0 ? value : null;
}

function validateBrandImageFile(file: File, label: "logo" | "icon") {
  if (!file.type.startsWith("image/")) {
    return `Upload a PNG, JPG, WebP, or SVG ${label} image.`;
  }

  if (file.size > BUSINESS_LOGO_MAX_FILE_SIZE_BYTES) {
    return `${label === "icon" ? "Brand icon" : "Logo"} file must be ${BUSINESS_LOGO_MAX_FILE_SIZE_MB} MB or smaller.`;
  }

  return null;
}
