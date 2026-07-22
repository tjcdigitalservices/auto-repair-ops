import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePlatformAdmin, getAppSessionState } from "@/lib/auth/session";
import { listTenants } from "@/lib/tenants";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { CreateTenantForm } from "@/features/platform/components/create-tenant-form";
import { TenantStatusBadge } from "@/features/platform/components/tenant-status-badge";

export default async function PlatformHomePage() {
  const session = await getAppSessionState();
  if (session.status === "authenticated" && session.context.kind === "staff") {
    redirect("/dashboard");
  }

  const admin = await requirePlatformAdmin();
  const tenants = await listTenants();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e8eef8,_#f8fafc_45%)]">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Platform
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Super Admin
            </h1>
            <p className="mt-1 text-sm text-slate-500">{admin.displayName}</p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Tenants</h2>
              <p className="mt-1 text-sm text-slate-500">
                Subscribed auto repair shops on this platform.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-600">{tenants.length} total</p>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            {tenants.length === 0 ? (
              <p className="py-8 text-sm text-slate-500">No tenants yet.</p>
            ) : (
              tenants.map((tenant) => (
                <Link
                  key={tenant.id}
                  href={`/platform/tenants/${tenant.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{tenant.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {tenant.slug} · {tenant.plan_key}
                    </p>
                  </div>
                  <TenantStatusBadge status={tenant.status} />
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Create tenant</h2>
          <p className="mt-1 text-sm text-slate-500">
            Provisions a shop subscription with a main branch and optional owner login.
          </p>
          <div className="mt-6">
            <CreateTenantForm />
          </div>
        </section>
      </main>
    </div>
  );
}
