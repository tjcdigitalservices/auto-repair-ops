import type { Json, TableRow } from "@/types/database";

export type StoreHoursDay = {
  day: string;
  hours: string;
};

export type ResolvedTenantBranding = {
  tenantId: string | null;
  slug: string | null;
  appName: string;
  companyName: string;
  supportEmail: string | null;
  phone: string | null;
  address: string | null;
  primaryColor: string;
  primaryColorStrong: string;
  primaryColorHover: string;
  accentColor: string;
  accentColorDark: string;
  softColor: string;
  borderColor: string;
  fontSans: string;
  fontDisplay: string;
  logoSrc: string;
  logoTightSrc: string;
  markSrc: string;
  faviconSrc: string;
  appleTouchIconSrc: string;
  loginBackgroundSrc: string;
  heroBackgroundSrc: string;
  featureBackgroundSrc: string;
  facebookUrl: string | null;
  facebookLabel: string | null;
  mapsUrl: string | null;
  websiteUrl: string | null;
  googleReviewsUrl: string | null;
  storeHours: StoreHoursDay[];
  metaTitle: string;
  metaDescription: string;
  tagline: string;
  receiptFooterDefault: string;
};

export const DEFAULT_BRAND_PACK = {
  appName: "Auto Repair Ops",
  companyName: "Auto Repair Shop",
  logoSrc: "/tenants/_default/logo-wl2.png",
  logoTightSrc: "/tenants/_default/logo-tight-wl2.png",
  markSrc: "/tenants/_default/mark-wl2.png",
  faviconSrc: "/tenants/_default/favicon-wl2.png",
  appleTouchIconSrc: "/tenants/_default/apple-touch-icon-wl2.png",
  loginBackgroundSrc: "/tenants/_default/login-background-wl2.png",
  heroBackgroundSrc: "/tenants/_default/hero-background-wl2.png",
  featureBackgroundSrc: "/tenants/_default/feature-background-wl2.png",
  primaryColor: "225 75% 17%",
  primaryColorStrong: "225 74% 12%",
  primaryColorHover: "220 77% 19%",
  accentColor: "0 69% 50%",
  accentColorDark: "0 72% 42%",
  softColor: "214 60% 95%",
  borderColor: "220 18% 91%",
  fontSans: "Space Grotesk",
  fontDisplay: "Barlow Condensed",
  tagline: "Precision service for every vehicle.",
  metaTitle: "Auto Repair Ops",
  metaDescription: "Workshop operations and customer website.",
  receiptFooterDefault: "Thank you for your business.",
  storeHours: [
    { day: "Monday", hours: "7:00 AM – 5:00 PM" },
    { day: "Tuesday", hours: "7:00 AM – 5:00 PM" },
    { day: "Wednesday", hours: "7:00 AM – 5:00 PM" },
    { day: "Thursday", hours: "7:00 AM – 5:00 PM" },
    { day: "Friday", hours: "7:00 AM – 5:00 PM" },
    { day: "Saturday", hours: "7:00 AM – 5:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ] satisfies StoreHoursDay[],
} as const;

type TenantBrandingRow = TableRow<"tenant_branding">;
type TenantRow = Pick<TableRow<"tenants">, "id" | "slug" | "name">;

function parseStoreHours(value: Json | null | undefined): StoreHoursDay[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_BRAND_PACK.storeHours];
  }

  const parsed = value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }
      const day = "day" in entry ? String(entry.day ?? "") : "";
      const hours = "hours" in entry ? String(entry.hours ?? "") : "";
      if (!day || !hours) {
        return null;
      }
      return { day, hours };
    })
    .filter((entry): entry is StoreHoursDay => entry !== null);

  return parsed.length > 0 ? parsed : [...DEFAULT_BRAND_PACK.storeHours];
}

function isLegacySayBrandName(value: string | null | undefined) {
  if (!value?.trim()) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("say auto care") ||
    normalized.includes("say-auto-care") ||
    normalized === "say" ||
    normalized.startsWith("say ")
  );
}

export function sanitizeBrandName(
  value: string | null | undefined,
  fallback: string,
) {
  const trimmed = value?.trim();
  if (!trimmed || isLegacySayBrandName(trimmed)) {
    return fallback;
  }
  return trimmed;
}

function isLegacySayAssetPath(path: string) {
  const value = path.trim().toLowerCase();
  return (
    value.includes("say-auto-care") ||
    value.includes("say_auto") ||
    value.includes("/brand/") ||
    value.includes("say-logo") ||
    value.includes("say-shield") ||
    value.includes("website-official-logo")
  );
}

function isBundledDefaultAssetPath(path: string) {
  const normalized = path.trim().split("?")[0]?.toLowerCase() ?? "";
  return normalized.startsWith("/tenants/_default/");
}

function assetOrDefault(path: string | null | undefined, fallback: string) {
  const trimmed = path?.trim();
  // Prefer the current cache-busted default pack over leftover DB/static SAY paths.
  if (!trimmed || isLegacySayAssetPath(trimmed) || isBundledDefaultAssetPath(trimmed)) {
    return fallback;
  }

  // Absolute URLs (e.g. Supabase public storage) or app-relative static paths.
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Storage object keys stored without a leading slash.
  return trimmed;
}

export function resolveTenantBranding(
  branding: TenantBrandingRow | null | undefined,
  tenant?: TenantRow | null,
): ResolvedTenantBranding {
  return {
    tenantId: tenant?.id ?? branding?.tenant_id ?? null,
    slug: tenant?.slug ?? null,
    appName: sanitizeBrandName(branding?.app_name, DEFAULT_BRAND_PACK.appName),
    companyName: sanitizeBrandName(
      branding?.company_name || tenant?.name,
      DEFAULT_BRAND_PACK.companyName,
    ),
    supportEmail: branding?.support_email ?? null,
    phone: branding?.phone ?? null,
    address: branding?.address ?? null,
    primaryColor: branding?.primary_color || DEFAULT_BRAND_PACK.primaryColor,
    primaryColorStrong:
      branding?.primary_color_strong || DEFAULT_BRAND_PACK.primaryColorStrong,
    primaryColorHover:
      branding?.primary_color_hover || DEFAULT_BRAND_PACK.primaryColorHover,
    accentColor: branding?.accent_color || DEFAULT_BRAND_PACK.accentColor,
    accentColorDark:
      branding?.accent_color_dark || DEFAULT_BRAND_PACK.accentColorDark,
    softColor: branding?.soft_color || DEFAULT_BRAND_PACK.softColor,
    borderColor: branding?.border_color || DEFAULT_BRAND_PACK.borderColor,
    fontSans: branding?.font_sans || DEFAULT_BRAND_PACK.fontSans,
    fontDisplay: branding?.font_display || DEFAULT_BRAND_PACK.fontDisplay,
    logoSrc: assetOrDefault(branding?.logo_path, DEFAULT_BRAND_PACK.logoSrc),
    logoTightSrc: assetOrDefault(
      branding?.logo_tight_path,
      DEFAULT_BRAND_PACK.logoTightSrc,
    ),
    markSrc: assetOrDefault(branding?.mark_path, DEFAULT_BRAND_PACK.markSrc),
    faviconSrc: assetOrDefault(
      branding?.favicon_path,
      DEFAULT_BRAND_PACK.faviconSrc,
    ),
    appleTouchIconSrc: assetOrDefault(
      branding?.favicon_path ?? branding?.mark_path,
      DEFAULT_BRAND_PACK.appleTouchIconSrc,
    ),
    loginBackgroundSrc: assetOrDefault(
      branding?.login_background_path,
      DEFAULT_BRAND_PACK.loginBackgroundSrc,
    ),
    heroBackgroundSrc: assetOrDefault(
      branding?.hero_background_path,
      DEFAULT_BRAND_PACK.heroBackgroundSrc,
    ),
    featureBackgroundSrc: assetOrDefault(
      branding?.feature_background_path,
      DEFAULT_BRAND_PACK.featureBackgroundSrc,
    ),
    facebookUrl: branding?.facebook_url ?? null,
    facebookLabel: branding?.facebook_label ?? null,
    mapsUrl: branding?.maps_url ?? null,
    websiteUrl: branding?.website_url ?? null,
    googleReviewsUrl: branding?.google_reviews_url ?? null,
    storeHours: parseStoreHours(branding?.store_hours),
    metaTitle: sanitizeBrandName(
      branding?.meta_title || branding?.app_name,
      DEFAULT_BRAND_PACK.metaTitle,
    ),
    metaDescription:
      branding?.meta_description?.trim() || DEFAULT_BRAND_PACK.metaDescription,
    tagline: branding?.tagline?.trim() || DEFAULT_BRAND_PACK.tagline,
    receiptFooterDefault:
      branding?.receipt_footer_default?.trim() ||
      DEFAULT_BRAND_PACK.receiptFooterDefault,
  };
}

export function resolveThemeCssVars(branding: ResolvedTenantBranding): string {
  return [
    `--brand-navy: ${branding.primaryColor};`,
    `--brand-navy-strong: ${branding.primaryColorStrong};`,
    `--brand-navy-hover: ${branding.primaryColorHover};`,
    `--brand-red: ${branding.accentColor};`,
    `--brand-red-dark: ${branding.accentColorDark};`,
    `--brand-soft: ${branding.softColor};`,
    `--brand-border: ${branding.borderColor};`,
    `--primary: ${branding.primaryColor};`,
    `--ring: ${branding.primaryColor};`,
  ].join("\n");
}

/** @deprecated Use branding resolver — kept for gradual migration */
export const DEFAULT_BRAND_LOGO_SRC = DEFAULT_BRAND_PACK.logoSrc;
export const DEFAULT_BRAND_LOGO_TIGHT_SRC = DEFAULT_BRAND_PACK.logoTightSrc;
export const OFFICIAL_BRAND_MARK_SRC = DEFAULT_BRAND_PACK.markSrc;
