"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Check, Search, Store } from "lucide-react";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { TenantStatusBadge } from "@/features/platform/components/tenant-status-badge";
import { TenantRowActions } from "@/features/platform/components/tenant-row-actions";
import type {
  PlatformTenantListItem,
  TenantSortOrder,
  TenantStatusFilter,
} from "@/features/platform/types";
import { formatPlanLabel } from "@/features/platform/utils";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: Array<{ value: TenantStatusFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "trial", label: "Trial" },
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past due" },
  { value: "suspended", label: "Suspended" },
  { value: "canceled", label: "Canceled" },
];

function trialMeta(tenant: PlatformTenantListItem) {
  if (!tenant.trialEndsAt || tenant.status !== "trial") {
    return null;
  }
  const endsAt = new Date(tenant.trialEndsAt);
  if (Number.isNaN(endsAt.getTime())) return null;
  const days = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Expired", expired: true };
  if (days === 0) return { label: "Ends today", expired: false };
  return { label: `${days} day${days === 1 ? "" : "s"} left`, expired: false };
}

export function TenantDirectory({ tenants }: { tenants: PlatformTenantListItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<TenantSortOrder>("newest");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = tenants.filter((tenant) => {
      if (statusFilter !== "all" && tenant.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return (
        tenant.name.toLowerCase().includes(normalizedQuery) ||
        tenant.slug.toLowerCase().includes(normalizedQuery)
      );
    });

    return matches.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [tenants, query, statusFilter, sortOrder]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Store className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Tenants</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Subscribed auto repair shops on this platform.
            </p>
          </div>
        </div>
        <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-600">
          {tenants.length} tenant{tenants.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search shop name or slug..."
            className="h-11 rounded-xl border-slate-200 pl-9"
            aria-label="Search tenants"
          />
        </div>
        <NativeSelect
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as TenantStatusFilter)}
          aria-label="Filter by status"
          className="h-11 rounded-xl lg:w-40"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
        <div className="relative lg:w-40">
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <NativeSelect
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as TenantSortOrder)}
            aria-label="Sort tenants"
            className="h-11 rounded-xl pl-9"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </NativeSelect>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            {tenants.length === 0
              ? "No tenants yet. Create the first shop to get started."
              : "No tenants match your search or filters."}
          </p>
        ) : (
          filtered.map((tenant) => {
            const trial = trialMeta(tenant);
            const accent =
              tenant.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : tenant.status === "trial"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-600";

            return (
              <div
                key={tenant.id}
                className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50/80"
              >
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    accent,
                  )}
                >
                  {tenant.status === "active" ? (
                    <Check className="size-5" />
                  ) : (
                    <Store className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/platform/tenants/${tenant.id}`}
                      className="truncate font-semibold text-slate-950 hover:text-blue-700"
                    >
                      {tenant.name}
                    </Link>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {tenant.slug} · {formatPlanLabel(tenant.planKey)}
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <TenantStatusBadge status={tenant.status} variant="table" />
                  {trial ? (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        trial.expired ? "text-destructive" : "text-slate-500",
                      )}
                    >
                      {trial.label}
                    </span>
                  ) : null}
                </div>
                <TenantRowActions tenant={tenant} />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
