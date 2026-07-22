"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaffCapability } from "@/lib/auth/session";
import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const brandingSchema = z.object({
  appName: z.string().trim().min(1).max(120),
  companyName: z.string().trim().min(1).max(120),
  supportEmail: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  primaryColor: z.string().trim().min(1).max(40),
  accentColor: z.string().trim().min(1).max(40),
  tagline: z.string().trim().max(200).optional().or(z.literal("")),
  metaTitle: z.string().trim().max(120).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(300).optional().or(z.literal("")),
  facebookUrl: z.string().trim().url().optional().or(z.literal("")),
  facebookLabel: z.string().trim().max(120).optional().or(z.literal("")),
  mapsUrl: z.string().trim().url().optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  googleReviewsUrl: z.string().trim().url().optional().or(z.literal("")),
  logoPath: z.string().trim().max(300).optional().or(z.literal("")),
  logoTightPath: z.string().trim().max(300).optional().or(z.literal("")),
  markPath: z.string().trim().max(300).optional().or(z.literal("")),
  faviconPath: z.string().trim().max(300).optional().or(z.literal("")),
  loginBackgroundPath: z.string().trim().max(300).optional().or(z.literal("")),
  heroBackgroundPath: z.string().trim().max(300).optional().or(z.literal("")),
  featureBackgroundPath: z.string().trim().max(300).optional().or(z.literal("")),
  receiptFooterDefault: z.string().trim().max(300).optional().or(z.literal("")),
});

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function updateTenantBrandingAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const context = await requireStaffCapability("settings:write");

  if (context.role !== "owner" && context.role !== "admin") {
    return { status: "error", message: "Insufficient permissions." };
  }

  const parsed = brandingSchema.safeParse({
    appName: formData.get("appName"),
    companyName: formData.get("companyName"),
    supportEmail: formData.get("supportEmail") || "",
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
    tagline: formData.get("tagline") || "",
    metaTitle: formData.get("metaTitle") || "",
    metaDescription: formData.get("metaDescription") || "",
    facebookUrl: formData.get("facebookUrl") || "",
    facebookLabel: formData.get("facebookLabel") || "",
    mapsUrl: formData.get("mapsUrl") || "",
    websiteUrl: formData.get("websiteUrl") || "",
    googleReviewsUrl: formData.get("googleReviewsUrl") || "",
    logoPath: formData.get("logoPath") || "",
    logoTightPath: formData.get("logoTightPath") || "",
    markPath: formData.get("markPath") || "",
    faviconPath: formData.get("faviconPath") || "",
    loginBackgroundPath: formData.get("loginBackgroundPath") || "",
    heroBackgroundPath: formData.get("heroBackgroundPath") || "",
    featureBackgroundPath: formData.get("featureBackgroundPath") || "",
    receiptFooterDefault: formData.get("receiptFooterDefault") || "",
  });

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("tenant_branding").upsert({
    tenant_id: context.tenantId,
    app_name: parsed.data.appName,
    company_name: parsed.data.companyName,
    support_email: emptyToNull(parsed.data.supportEmail),
    phone: emptyToNull(parsed.data.phone),
    address: emptyToNull(parsed.data.address),
    primary_color: parsed.data.primaryColor,
    accent_color: parsed.data.accentColor,
    tagline: emptyToNull(parsed.data.tagline),
    meta_title: emptyToNull(parsed.data.metaTitle),
    meta_description: emptyToNull(parsed.data.metaDescription),
    facebook_url: emptyToNull(parsed.data.facebookUrl),
    facebook_label: emptyToNull(parsed.data.facebookLabel),
    maps_url: emptyToNull(parsed.data.mapsUrl),
    website_url: emptyToNull(parsed.data.websiteUrl),
    google_reviews_url: emptyToNull(parsed.data.googleReviewsUrl),
    logo_path: emptyToNull(parsed.data.logoPath),
    logo_tight_path: emptyToNull(parsed.data.logoTightPath),
    mark_path: emptyToNull(parsed.data.markPath),
    favicon_path: emptyToNull(parsed.data.faviconPath),
    login_background_path: emptyToNull(parsed.data.loginBackgroundPath),
    hero_background_path: emptyToNull(parsed.data.heroBackgroundPath),
    feature_background_path: emptyToNull(parsed.data.featureBackgroundPath),
    receipt_footer_default: emptyToNull(parsed.data.receiptFooterDefault),
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/settings/branches");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { status: "success", message: "Branding updated." };
}
