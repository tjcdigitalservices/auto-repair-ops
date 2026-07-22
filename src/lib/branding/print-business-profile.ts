import { DEFAULT_BRAND_PACK, sanitizeBrandName } from "@/lib/branding/types";
import { buildBusinessLogoUrl } from "@/lib/storage";
import type { TableRow } from "@/types/database";

type BusinessSettingsSlice = Pick<
  TableRow<"business_settings">,
  | "business_name"
  | "business_logo_path"
  | "business_vat_registration_no"
  | "business_contact"
  | "business_email"
  | "business_address"
  | "updated_at"
>;

type TenantBrandingPublicSlice = {
  website_url?: string | null;
  facebook_label?: string | null;
};

export type PrintBusinessProfile = {
  businessName: string;
  businessLogoUrl: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  websiteUrl: string | null;
  facebookLabel: string | null;
};

export function buildPrintBusinessProfile(
  settings: BusinessSettingsSlice | null | undefined,
  branding: TenantBrandingPublicSlice | null | undefined,
): PrintBusinessProfile {
  return {
    businessName: sanitizeBrandName(
      settings?.business_name,
      DEFAULT_BRAND_PACK.companyName,
    ),
    businessLogoUrl: buildBusinessLogoUrl(
      settings?.business_logo_path ?? null,
      settings?.updated_at ?? null,
    ),
    businessVatRegistrationNo: settings?.business_vat_registration_no ?? null,
    businessContact: settings?.business_contact ?? null,
    businessEmail: settings?.business_email ?? null,
    businessAddress: settings?.business_address ?? null,
    websiteUrl: branding?.website_url ?? null,
    facebookLabel: branding?.facebook_label ?? null,
  };
}
