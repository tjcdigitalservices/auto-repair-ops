import "server-only";

import { getTenantBrandingById } from "@/lib/branding";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TenantStatus } from "@/lib/tenants/status";
import type {
  PlatformTenantActivityItem,
  PlatformTenantUserItem,
  PlatformTenantWorkspaceData,
} from "@/features/platform/types";

export async function getPlatformTenantWorkspace(
  tenantId: string,
): Promise<PlatformTenantWorkspaceData | null> {
  await requirePlatformAdmin();
  const admin = getSupabaseAdminClient();

  const [{ data: tenant }, { data: branches }, branding, { data: staffRows }] =
    await Promise.all([
      admin.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
      admin
        .from("branches")
        .select(
          "id, code, name, address, contact_number, email, is_main, is_active, status",
        )
        .eq("tenant_id", tenantId)
        .order("is_main", { ascending: false })
        .order("name", { ascending: true }),
      getTenantBrandingById(tenantId),
      admin
        .from("staff")
        .select(
          "id, first_name, last_name, role, status, linked_user_id, updated_at, created_at",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),
    ]);

  if (!tenant) {
    return null;
  }

  const users = await mapStaffUsers(staffRows ?? []);
  const ownerUser = users.find((user) => user.isOwner) ?? null;
  const activity = await listTenantActivity(tenantId);

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status as TenantStatus,
      planKey: tenant.plan_key,
      trialEndsAt: tenant.trial_ends_at,
      billingCustomerId: tenant.billing_customer_id,
      currencyCode: tenant.currency_code,
      timezone: tenant.timezone,
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
    },
    branding: {
      appName: branding.appName,
      companyName: branding.companyName,
      logoSrc: branding.logoSrc,
      publicPath: `/t/${tenant.slug}`,
    },
    branches: (branches ?? []).map((branch) => ({
      id: branch.id,
      code: branch.code,
      name: branch.name,
      address: branch.address,
      contactNumber: branch.contact_number,
      email: branch.email,
      isMain: branch.is_main,
      isActive: branch.is_active,
      status: branch.status,
    })),
    users,
    owner: ownerUser
      ? {
          staffId: ownerUser.id,
          fullName: ownerUser.fullName,
          email: ownerUser.email,
          status: ownerUser.status,
          hasLinkedAccount: ownerUser.hasLinkedAccount,
        }
      : null,
    activity,
  };
}

async function mapStaffUsers(
  staffRows: Array<{
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
    linked_user_id: string | null;
    updated_at: string;
  }>,
): Promise<PlatformTenantUserItem[]> {
  const admin = getSupabaseAdminClient();

  const emails = await Promise.all(
    staffRows.map(async (row) => {
      if (!row.linked_user_id) {
        return null;
      }
      const { data } = await admin.auth.admin.getUserById(row.linked_user_id);
      return data.user?.email ?? null;
    }),
  );

  return staffRows.map((row, index) => ({
    id: row.id,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    email: emails[index],
    role: row.role,
    status: row.status,
    updatedAt: row.updated_at,
    isOwner: row.role === "owner",
    hasLinkedAccount: Boolean(row.linked_user_id),
  }));
}

async function listTenantActivity(
  tenantId: string,
): Promise<PlatformTenantActivityItem[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("id, user_id, action, entity_type, entity_id, created_at, after_data")
    .eq("entity_type", "tenant")
    .eq("entity_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error || !data?.length) {
    return [];
  }

  const actorEmails = await Promise.all(
    data.map(async (row) => {
      if (!row.user_id) {
        return null;
      }
      const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
      return userData.user?.email ?? null;
    }),
  );

  return data.map((row, index) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    createdAt: row.created_at,
    actorEmail: actorEmails[index],
    summary: formatActivitySummary(row.action, row.after_data),
  }));
}

function formatActivitySummary(action: string, afterData: unknown) {
  if (afterData && typeof afterData === "object" && !Array.isArray(afterData)) {
    const status = (afterData as Record<string, unknown>).status;
    if (typeof status === "string") {
      return `${action.replaceAll("_", " ")} · status ${status}`;
    }
  }
  return action.replaceAll("_", " ");
}
