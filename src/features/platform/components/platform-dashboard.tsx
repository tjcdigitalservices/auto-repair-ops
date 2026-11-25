"use client";

import { Plus } from "lucide-react";

import { CreateTenantForm } from "@/features/platform/components/create-tenant-form";
import { PlatformShell } from "@/features/platform/components/platform-shell";
import { TenantDirectory } from "@/features/platform/components/tenant-directory";
import type { PlatformTenantListItem } from "@/features/platform/types";

export function PlatformDashboard({
  adminDisplayName,
  adminRole,
  tenants,
}: {
  adminDisplayName: string;
  adminRole: string;
  tenants: PlatformTenantListItem[];
}) {
  const existingSlugs = tenants.map((tenant) => tenant.slug);

  return (
    <PlatformShell adminDisplayName={adminDisplayName} adminRole={adminRole}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.85fr)]">
        <TenantDirectory tenants={tenants} />

        <section className="h-fit overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Plus className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Create New Tenant</h2>
              <p className="mt-0.5 text-sm leading-6 text-slate-500">
                Provision a shop subscription with a main branch and optional owner login.
              </p>
            </div>
          </div>
          <div className="px-5 py-5">
            <CreateTenantForm existingSlugs={existingSlugs} compact />
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}
