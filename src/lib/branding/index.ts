import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";

import {
  DEFAULT_BRAND_PACK,
  resolveTenantBranding,
  sanitizeBrandName,
  type ResolvedTenantBranding,
} from "@/lib/branding/types";
import { BUSINESS_ASSETS_BUCKET } from "@/lib/constants/storage";
import { buildBusinessLogoUrl, buildPublicStorageUrl } from "@/lib/storage";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export { sanitizeBrandName };

export const TENANT_SLUG_COOKIE = "tenant_slug";
export const TENANT_SLUG_HEADER = "x-tenant-slug";

export function getDefaultBranding(): ResolvedTenantBranding {
  return resolveTenantBranding(null, null);
}

export const getTenantBrandingById = cache(
  async (tenantId: string): Promise<ResolvedTenantBranding> => {
    const supabase = await getSupabaseServerClient();
    const [{ data: tenant }, { data: branding }] = await Promise.all([
      supabase
        .from("tenants")
        .select("id, slug, name")
        .eq("id", tenantId)
        .maybeSingle(),
      supabase
        .from("tenant_branding")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle(),
    ]);

    return enrichBrandingWithBusinessAssets(
      materializeBrandingAssets(resolveTenantBranding(branding, tenant)),
    );
  },
);

export const getTenantBrandingBySlug = cache(
  async (slug: string): Promise<ResolvedTenantBranding> => {
    try {
      const supabase = await getSupabaseAdminClient();
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("id, slug, name, status")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !tenant || !["trial", "active", "past_due"].includes(tenant.status)) {
        return getDefaultBranding();
      }

      const { data: branding } = await supabase
        .from("tenant_branding")
        .select("*")
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      return enrichBrandingWithBusinessAssets(
        materializeBrandingAssets(resolveTenantBranding(branding, tenant)),
      );
    } catch {
      return getDefaultBranding();
    }
  },
);

export async function resolveRequestTenantSlug(): Promise<string | null> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(TENANT_SLUG_HEADER)?.trim().toLowerCase();
  if (fromHeader) {
    return fromHeader;
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(TENANT_SLUG_COOKIE)?.value?.trim().toLowerCase();
  if (fromCookie) {
    return fromCookie;
  }

  const host = headerStore.get("host") ?? "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();

  if (rootDomain && hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.slice(0, -(rootDomain.length + 1));
    if (subdomain && subdomain !== "www" && subdomain !== "app") {
      return subdomain;
    }
  }

  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.trim().toLowerCase() || "legacy";
}

export const getRequestTenantBranding = cache(
  async (): Promise<ResolvedTenantBranding> => {
    // Logged-in staff should always see their shop theme, even if the
    // tenant_slug cookie still points at legacy/default.
    const staffTenantId = await resolveAuthenticatedStaffTenantId();
    if (staffTenantId) {
      return getTenantBrandingById(staffTenantId);
    }

    const slug = await resolveRequestTenantSlug();
    if (!slug) {
      return getDefaultBranding();
    }
    return getTenantBrandingBySlug(slug);
  },
);

async function resolveAuthenticatedStaffTenantId(): Promise<string | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: staff } = await supabase
      .from("staff")
      .select("tenant_id")
      .eq("linked_user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    return staff?.tenant_id ?? null;
  } catch {
    return null;
  }
}

export async function getTenantIdBySlug(slug: string): Promise<string | null> {
  const supabase = await getSupabaseAdminClient();
  const { data } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

function materializeAssetSrc(path: string) {
  const value = path.trim();
  if (!value) {
    return value;
  }
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  try {
    return buildPublicStorageUrl(BUSINESS_ASSETS_BUCKET, value);
  } catch {
    return value;
  }
}

function materializeBrandingAssets(
  branding: ResolvedTenantBranding,
): ResolvedTenantBranding {
  return {
    ...branding,
    logoSrc: materializeAssetSrc(branding.logoSrc),
    logoTightSrc: materializeAssetSrc(branding.logoTightSrc),
    markSrc: materializeAssetSrc(branding.markSrc),
    faviconSrc: materializeAssetSrc(branding.faviconSrc),
    appleTouchIconSrc: materializeAssetSrc(branding.appleTouchIconSrc),
    loginBackgroundSrc: materializeAssetSrc(branding.loginBackgroundSrc),
    heroBackgroundSrc: materializeAssetSrc(branding.heroBackgroundSrc),
    featureBackgroundSrc: materializeAssetSrc(branding.featureBackgroundSrc),
  };
}

function isFallbackBrandAsset(src: string, fallback: string) {
  const normalizedSrc = src.split("?")[0] ?? src;
  const normalizedFallback = fallback.split("?")[0] ?? fallback;
  return (
    !src ||
    src === fallback ||
    normalizedSrc === normalizedFallback ||
    normalizedSrc.startsWith("/tenants/_default/") ||
    normalizedSrc.includes("/tenants/_default/") ||
    normalizedSrc.includes("/brand/")
  );
}

async function enrichBrandingWithBusinessAssets(
  branding: ResolvedTenantBranding,
): Promise<ResolvedTenantBranding> {
  if (!branding.tenantId) {
    return branding;
  }

  try {
    const supabase = await getSupabaseAdminClient();
    const { data: branch } = await supabase
      .from("branches")
      .select("id")
      .eq("tenant_id", branding.tenantId)
      .eq("is_main", true)
      .maybeSingle();

    if (!branch) {
      return branding;
    }

    const { data: settings } = await supabase
      .from("business_settings")
      .select("business_name, business_logo_path, business_mark_path, updated_at")
      .eq("branch_id", branch.id)
      .maybeSingle();

    if (!settings) {
      return branding;
    }

    const uploadedLogoUrl = buildBusinessLogoUrl(
      settings.business_logo_path,
      settings.updated_at,
    );
    const uploadedMarkUrl = buildBusinessLogoUrl(
      settings.business_mark_path,
      settings.updated_at,
    );

    return {
      ...branding,
      companyName: sanitizeBrandName(
        settings.business_name,
        branding.companyName,
      ),
      appName: sanitizeBrandName(settings.business_name, branding.appName),
      logoSrc:
        isFallbackBrandAsset(branding.logoSrc, DEFAULT_BRAND_PACK.logoSrc) &&
        uploadedLogoUrl
          ? uploadedLogoUrl
          : branding.logoSrc,
      logoTightSrc:
        isFallbackBrandAsset(branding.logoTightSrc, DEFAULT_BRAND_PACK.logoTightSrc) &&
        uploadedLogoUrl
          ? uploadedLogoUrl
          : branding.logoTightSrc,
      markSrc:
        isFallbackBrandAsset(branding.markSrc, DEFAULT_BRAND_PACK.markSrc) &&
        uploadedMarkUrl
          ? uploadedMarkUrl
          : branding.markSrc,
      faviconSrc:
        isFallbackBrandAsset(branding.faviconSrc, DEFAULT_BRAND_PACK.faviconSrc) &&
        uploadedMarkUrl
          ? uploadedMarkUrl
          : branding.faviconSrc,
      appleTouchIconSrc:
        isFallbackBrandAsset(
          branding.appleTouchIconSrc,
          DEFAULT_BRAND_PACK.appleTouchIconSrc,
        ) && uploadedMarkUrl
          ? uploadedMarkUrl
          : branding.appleTouchIconSrc,
    };
  } catch {
    return branding;
  }
}

export { DEFAULT_BRAND_PACK };
