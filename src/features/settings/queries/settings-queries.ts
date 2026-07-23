import type { TableRow } from "@/types/database";

import { getBranchScopedServerClient, getBranchScope, getMainBranch } from "@/lib/branches";
import { getTenantBrandingById } from "@/lib/branding";
import {
  extractLogoColorCandidates,
  type LogoColorCandidate,
} from "@/lib/branding/extract-logo-palette";
import { DEFAULT_BRAND_PACK, sanitizeBrandName } from "@/lib/branding/types";
import { requireStaffCapability } from "@/lib/auth/session";
import { BUSINESS_ASSETS_BUCKET } from "@/lib/constants/storage";
import { buildBusinessLogoUrl } from "@/lib/storage";
import { SETTINGS_DOCUMENT_SEQUENCE_DEFAULTS } from "@/features/settings/document-sequence-defaults";
import {
  mapBusinessSettingsRowToValues,
  mapDocumentSequenceRowToItem,
} from "@/features/settings/mappers";
import { mapTenantBrandingToPublicPresenceValues } from "@/features/settings/store-hours";
import type {
  BusinessBranding,
  BusinessSettingsValues,
  PublicPresenceSettingsValues,
  SettingsDocumentSequence,
  SettingsPageData,
  SettingsPageTab,
  SettingsTabPageData,
  ThemePalettePreview,
} from "@/features/settings/types";

type BusinessSettingsRow = TableRow<"business_settings">;
type DocumentSequenceRow = TableRow<"document_sequences">;

export async function getBusinessBranding(branchId?: string | null): Promise<BusinessBranding> {
  const fallbackBranch = branchId ? { id: branchId } : await getMainBranch();
  const { supabase } = await getBranchScopedServerClient("settings:read");
  const { data, error } = await supabase
    .from("business_settings")
    .select("business_name, business_logo_path, business_mark_path, updated_at")
    .eq("branch_id", fallbackBranch.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Business settings are not configured for the selected branch.");
  }

  return {
    businessName: sanitizeBrandName(
      data.business_name,
      DEFAULT_BRAND_PACK.companyName,
    ),
    businessLogoUrl: buildBusinessLogoUrl(data.business_logo_path, data.updated_at),
    businessMarkUrl: buildBusinessLogoUrl(data.business_mark_path, data.updated_at),
  };
}

export async function getSettingsTabPageData(
  tab: SettingsPageTab,
): Promise<SettingsTabPageData> {
  switch (tab) {
    case "profile":
      return {
        tab,
        settings: await getBusinessSettingsValues(),
      };
    case "branches": {
      const context = await requireStaffCapability("settings:read");
      const [scope, branding] = await Promise.all([
        getBranchScope(),
        getTenantBrandingById(context.tenantId),
      ]);

      return {
        tab,
        branches: scope.accessibleBranches.map((branch) => ({
          id: branch.id,
          name: branch.name,
          code: branch.code,
          isMain: Boolean(branch.is_main),
        })),
        selectedBranchId: scope.writeBranchId,
        canSwitch: scope.canAccessAllBranches,
        canManageBranches: context.role === "owner",
        canEditTenantBranding: context.role === "owner" || context.role === "admin",
        branding,
      };
    }
    case "operations":
      return {
        tab,
        settings: await getBusinessSettingsValues(),
      };
    case "theme":
      return {
        tab,
        themePalette: await getThemePalettePreview(),
      };
    case "presence":
      return {
        tab,
        publicPresence: await getPublicPresenceSettingsValues(),
      };
    case "documents":
      return {
        tab,
        documentSequences: await getSettingsDocumentSequences(),
      };
  }
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const { branchScope } = await getBranchScopedServerClient("settings:write");
  const [settings, publicPresence, themePalette, documentSequences] = await Promise.all([
    getBusinessSettingsValues(),
    getPublicPresenceSettingsValues(),
    getThemePalettePreview(),
    getSettingsDocumentSequences(),
  ]);

  return {
    branchName: branchScope.selectedBranch?.name ?? branchScope.selectedBranchLabel,
    settings,
    publicPresence,
    themePalette,
    documentSequences,
  };
}

export async function getBusinessSettingsValues(): Promise<BusinessSettingsValues> {
  const { branchScope, supabase } = await getBranchScopedServerClient("settings:write");
  const { data: settings, error } = await supabase
    .from("business_settings")
    .select("*")
    .eq("branch_id", branchScope.writeBranchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!settings) {
    throw new Error("Business settings are not configured for the selected branch.");
  }

  return mapBusinessSettingsRowToValues(settings as BusinessSettingsRow);
}

export async function getPublicPresenceSettingsValues(): Promise<PublicPresenceSettingsValues> {
  const { context, supabase } = await getBranchScopedServerClient("settings:write");
  const { data: tenantBranding, error } = await supabase
    .from("tenant_branding")
    .select("website_url, facebook_url, facebook_label, store_hours")
    .eq("tenant_id", context.tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return mapTenantBrandingToPublicPresenceValues(tenantBranding);
}

async function getThemePalettePreview(): Promise<ThemePalettePreview> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const [
    { data: settings, error: settingsError },
    { data: tenantBranding, error: brandingError },
  ] = await Promise.all([
    supabase
      .from("business_settings")
      .select("business_logo_path, business_mark_path")
      .eq("branch_id", branchScope.writeBranchId)
      .maybeSingle(),
    supabase
      .from("tenant_branding")
      .select("primary_color, accent_color")
      .eq("tenant_id", context.tenantId)
      .maybeSingle(),
  ]);

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (brandingError) {
    throw new Error(brandingError.message);
  }

  if (!settings) {
    throw new Error("Business settings are not configured for the selected branch.");
  }

  const primaryColor =
    tenantBranding?.primary_color?.trim() || DEFAULT_BRAND_PACK.primaryColor;
  const accentColor =
    tenantBranding?.accent_color?.trim() || DEFAULT_BRAND_PACK.accentColor;

  const candidates = await loadThemeColorCandidates(supabase, {
    markPath: settings.business_mark_path,
    logoPath: settings.business_logo_path,
    primaryColor,
    accentColor,
  });

  return {
    primaryColor,
    accentColor,
    candidates,
  };
}

async function getSettingsDocumentSequences(): Promise<SettingsDocumentSequence[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;

  await ensureSettingsDocumentSequences(supabase, branchId);

  const { data: documentSequences, error } = await supabase
    .from("document_sequences")
    .select("*")
    .eq("branch_id", branchId)
    .in("key", ["quotation", "job_order", "invoice", "sale"])
    .order("key", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((documentSequences ?? []) as DocumentSequenceRow[]).map(mapDocumentSequenceRowToItem);
}

async function loadThemeColorCandidates(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  input: {
    markPath: string | null;
    logoPath: string | null;
    primaryColor: string;
    accentColor: string;
  },
): Promise<LogoColorCandidate[]> {
  const objectPath = input.markPath || input.logoPath;
  let extracted: LogoColorCandidate[] = [];

  if (objectPath) {
    try {
      const { data, error } = await supabase.storage
        .from(BUSINESS_ASSETS_BUCKET)
        .download(objectPath);
      if (!error && data) {
        const bytes = Buffer.from(await data.arrayBuffer());
        extracted = await extractLogoColorCandidates(bytes, 5);
      }
    } catch {
      extracted = [];
    }
  }

  const merged: LogoColorCandidate[] = [];
  const seen = new Set<string>();

  function pushCandidate(candidate: LogoColorCandidate) {
    if (seen.has(candidate.hsl)) {
      return;
    }
    seen.add(candidate.hsl);
    merged.push(candidate);
  }

  pushCandidate({ hsl: input.primaryColor, label: "Current buttons" });
  pushCandidate({ hsl: input.accentColor, label: "Current accent" });
  for (const candidate of extracted) {
    pushCandidate(candidate);
  }

  return merged;
}

async function ensureSettingsDocumentSequences(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string,
) {
  const { error } = await supabase.from("document_sequences").upsert(
    SETTINGS_DOCUMENT_SEQUENCE_DEFAULTS.map((sequence) => ({
      key: sequence.key,
      branch_id: branchId,
      prefix: sequence.prefix,
      padding: sequence.padding,
      last_value: sequence.last_value,
    })),
    { onConflict: "key,branch_id", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(error.message);
  }
}
