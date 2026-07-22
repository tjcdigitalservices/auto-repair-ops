import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppCapability, StaffRole } from "@/lib/auth/permissions";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { SELECTED_BRANCH_COOKIE } from "@/lib/tenants";
import type { TableRow } from "@/types/database";

export { shouldShowBranchSelector } from "@/lib/branch-selector-visibility";

type BranchRow = Pick<
  TableRow<"branches">,
  "id" | "tenant_id" | "code" | "name" | "address" | "contact_number" | "email" | "is_main" | "is_active"
>;

export type BranchScope = {
  accessibleBranches: BranchRow[];
  canAccessAllBranches: boolean;
  currentUserBranchId: string | null;
  selectedBranchId: string | null;
  selectedBranch: BranchRow | null;
  selectedBranchLabel: string;
  writeBranchId: string;
  tenantId: string;
};

export function canAccessAllBranches(role: StaffRole) {
  return role === "owner";
}

export type BranchSelectorBranch = {
  id: string;
  name: string;
  code: string;
};

/** Server-side props for {@link BranchSelector} on list and report pages. */
export function getPageBranchSelectorProps(scope: BranchScope) {
  const branches = scope.accessibleBranches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    code: branch.code,
  }));

  return {
    branches,
    selectedBranchId: scope.selectedBranchId,
    canSwitch: scope.canAccessAllBranches,
  };
}

export type PageBranchSelectorProps = ReturnType<typeof getPageBranchSelectorProps>;

export const getMainBranchForTenant = cache(async (tenantId: string): Promise<BranchRow> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("branches")
    .select("id, tenant_id, code, name, address, contact_number, email, is_main, is_active")
    .eq("tenant_id", tenantId)
    .eq("is_main", true)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Main branch is not configured for this tenant.");
  }

  return data as BranchRow;
});

export const getMainBranch = cache(async (): Promise<BranchRow> => {
  const context = await requireAuthenticatedStaff();
  return getMainBranchForTenant(context.tenantId);
});

export const getDefaultBranch = getMainBranch;

const listAccessibleBranchesCached = cache(async (): Promise<{
  accessibleBranches: BranchRow[];
  canAccessAllBranches: boolean;
  currentUserBranchId: string | null;
  tenantId: string;
}> => {
  const context = await requireAuthenticatedStaff();
  const supabase = await getSupabaseServerClient();
  const hasGlobalAccess = canAccessAllBranches(context.role);
  let query = supabase
    .from("branches")
    .select("id, tenant_id, code, name, address, contact_number, email, is_main, is_active")
    .eq("tenant_id", context.tenantId)
    .eq("is_active", true)
    .order("is_main", { ascending: false })
    .order("name", { ascending: true });

  if (!hasGlobalAccess) {
    if (!context.branchId) {
      throw new Error("This staff account is not assigned to a branch.");
    }

    query = query.eq("id", context.branchId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    accessibleBranches: (data ?? []) as BranchRow[],
    canAccessAllBranches: hasGlobalAccess,
    currentUserBranchId: context.branchId,
    tenantId: context.tenantId,
  };
});

export async function listAccessibleBranches() {
  return listAccessibleBranchesCached();
}

export async function getCurrentUserBranch() {
  const { accessibleBranches, currentUserBranchId } = await listAccessibleBranchesCached();

  if (!currentUserBranchId) {
    return null;
  }

  return accessibleBranches.find((branch) => branch.id === currentUserBranchId) ?? null;
}

export async function getBranchScope(): Promise<BranchScope> {
  const [{ accessibleBranches, canAccessAllBranches: hasGlobalAccess, currentUserBranchId, tenantId }, mainBranch] =
    await Promise.all([listAccessibleBranchesCached(), getMainBranch()]);

  const cookieStore = await cookies();
  const preferredBranchId = cookieStore.get(SELECTED_BRANCH_COOKIE)?.value ?? null;
  const preferredAccessible = preferredBranchId
    ? accessibleBranches.find((branch) => branch.id === preferredBranchId) ?? null
    : null;

  const selectedBranchId =
    preferredAccessible?.id ?? currentUserBranchId ?? mainBranch.id;
  const resolvedSelectedBranch =
    accessibleBranches.find((branch) => branch.id === selectedBranchId) ??
    (selectedBranchId === mainBranch.id ? mainBranch : null);
  const writeBranchId =
    selectedBranchId ??
    currentUserBranchId ??
    resolvedSelectedBranch?.id ??
    mainBranch.id;

  return {
    accessibleBranches,
    canAccessAllBranches: hasGlobalAccess,
    currentUserBranchId,
    selectedBranchId,
    selectedBranch: resolvedSelectedBranch,
    selectedBranchLabel: resolvedSelectedBranch?.name ?? "Branch",
    writeBranchId,
    tenantId,
  };
}

export async function requireBranchAccess(branchId: string) {
  const scope = await getBranchScope();

  if (scope.canAccessAllBranches) {
    if (
      scope.accessibleBranches.some((branch) => branch.id === branchId) ||
      branchId === scope.currentUserBranchId
    ) {
      return scope;
    }
  } else if (scope.writeBranchId === branchId) {
    return scope;
  }

  throw new Error("You do not have access to that branch.");
}

export async function getBranchScopedServerClient(capability: AppCapability) {
  const [{ context, supabase }, branchScope] = await Promise.all([
    getAuthorizedSupabaseServerClient(capability),
    getBranchScope(),
  ]);

  return { context, supabase, branchScope };
}

export function applyBranchFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  branchId: string | null,
  column = "branch_id",
) {
  if (!branchId) {
    return query;
  }

  return query.eq(column, branchId);
}

export function applyTenantFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  tenantId: string | null,
  column = "tenant_id",
) {
  if (!tenantId) {
    return query;
  }

  return query.eq(column, tenantId);
}

export function applySharedCatalogBranchFilter<T extends { or: (filters: string) => T }>(
  query: T,
  branchId: string | null,
  column = "branch_id",
) {
  if (!branchId) {
    return query;
  }

  return query.or(`${column}.is.null,${column}.eq.${branchId}`);
}
