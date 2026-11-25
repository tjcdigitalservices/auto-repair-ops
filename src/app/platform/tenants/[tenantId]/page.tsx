import { notFound } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/auth/session";
import { getPlatformTenantWorkspace } from "@/features/platform/queries/platform-tenant-queries";
import { TenantWorkspace } from "@/features/platform/components/tenant-workspace";
import { resolvePlatformTenantTab } from "@/features/platform/utils";

export default async function PlatformTenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requirePlatformAdmin();
  const [{ tenantId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const data = await getPlatformTenantWorkspace(tenantId);
  if (!data) {
    notFound();
  }

  const initialTab = resolvePlatformTenantTab(resolvedSearchParams?.tab);

  return (
    <TenantWorkspace
      data={data}
      initialTab={initialTab}
      adminDisplayName={admin.displayName}
      adminRole={admin.role}
    />
  );
}
