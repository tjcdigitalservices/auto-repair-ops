import { redirect } from "next/navigation";

import { requirePlatformAdmin, getAppSessionState } from "@/lib/auth/session";
import { listTenants } from "@/lib/tenants";
import { PlatformDashboard } from "@/features/platform/components/platform-dashboard";
import type { PlatformTenantListItem } from "@/features/platform/types";
import type { TenantStatus } from "@/lib/tenants/status";

export default async function PlatformHomePage() {
  const session = await getAppSessionState();
  if (session.status === "authenticated" && session.context.kind === "staff") {
    redirect("/dashboard");
  }

  const admin = await requirePlatformAdmin();
  const tenants = await listTenants();

  const items: PlatformTenantListItem[] = tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status as TenantStatus,
    planKey: tenant.plan_key,
    trialEndsAt: tenant.trial_ends_at,
    createdAt: tenant.created_at,
  }));

  return (
    <PlatformDashboard
      adminDisplayName={admin.displayName}
      adminRole={admin.role}
      tenants={items}
    />
  );
}
