import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isTenantOperable } from "@/lib/tenants/status";
import type { TableRow } from "@/types/database";

export type TenantRow = TableRow<"tenants">;
export { isTenantOperable, OPERABLE_TENANT_STATUSES } from "@/lib/tenants/status";
export type { TenantStatus } from "@/lib/tenants/status";

export const listTenants = cache(async (): Promise<TenantRow[]> => {
  await requirePlatformAdmin();
  const supabase = await getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TenantRow[];
});

export const getTenantById = cache(async (tenantId: string): Promise<TenantRow | null> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TenantRow | null;
});

export async function requireOperableTenant(tenantId: string) {
  const tenant = await getTenantById(tenantId);
  if (!tenant || !isTenantOperable(tenant.status)) {
    redirect("/login?reason=tenant_suspended");
  }
  return tenant;
}

export const SELECTED_BRANCH_COOKIE = "selected_branch_id";

export async function getSelectedBranchCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SELECTED_BRANCH_COOKIE)?.value ?? null;
}

export async function setSelectedBranchCookie(branchId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_BRANCH_COOKIE, branchId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}
