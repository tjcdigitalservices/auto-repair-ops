import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantBrandingById } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { TenantStatusForm } from "@/features/platform/components/tenant-status-form";
import { TenantStatusBadge } from "@/features/platform/components/tenant-status-badge";

export default async function PlatformTenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  await requirePlatformAdmin();
  const { tenantId } = await params;
  const admin = getSupabaseAdminClient();

  const [{ data: tenant }, { data: branches }, branding] = await Promise.all([
    admin.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
    admin
      .from("branches")
      .select("id, code, name, is_main, is_active")
      .eq("tenant_id", tenantId)
      .order("is_main", { ascending: false }),
    getTenantBrandingById(tenantId),
  ]);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e8eef8,_#f8fafc_45%)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/platform" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← All tenants
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              {tenant.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {tenant.slug} · {tenant.currency_code} · {tenant.timezone}
            </p>
          </div>
          <TenantStatusBadge status={tenant.status} />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Subscription</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Plan</dt>
                <dd className="font-medium text-slate-900">{tenant.plan_key}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Billing customer</dt>
                <dd className="font-medium text-slate-900">
                  {tenant.billing_customer_id ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Trial ends</dt>
                <dd className="font-medium text-slate-900">
                  {tenant.trial_ends_at
                    ? new Date(tenant.trial_ends_at).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
            </dl>
            <div className="mt-6">
              <TenantStatusForm tenantId={tenant.id} currentStatus={tenant.status} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Branding</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">App name</dt>
                <dd className="font-medium text-slate-900">{branding.appName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Company</dt>
                <dd className="font-medium text-slate-900">{branding.companyName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Public path</dt>
                <dd className="font-medium text-slate-900">/t/{tenant.slug}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="mt-6">
              <Link href={`/t/${tenant.slug}`} target="_blank">
                Open public site
              </Link>
            </Button>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Branches</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {(branches ?? []).map((branch) => (
              <li key={branch.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{branch.name}</p>
                  <p className="text-slate-500">{branch.code}</p>
                </div>
                <p className="text-slate-500">
                  {branch.is_main ? "Main" : "Branch"}
                  {!branch.is_active ? " · inactive" : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
