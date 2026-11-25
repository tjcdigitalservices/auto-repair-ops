"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Activity as ActivityIcon,
  Building2,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  GitBranch,
  MoreHorizontal,
  Paintbrush,
  PauseCircle,
  Pencil,
  Plus,
  Store,
  Users,
} from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import {
  PageTabPanel,
  PageTabs,
  type PageTabDefinition,
} from "@/components/shared/page-tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateTenantStatusAction } from "@/features/platform/actions/platform-actions";
import { PlatformShell } from "@/features/platform/components/platform-shell";
import { PlatformSidePanel } from "@/features/platform/components/platform-side-panel";
import { TenantEditForm } from "@/features/platform/components/tenant-edit-form";
import { TenantStatusBadge } from "@/features/platform/components/tenant-status-badge";
import { TenantStatusForm } from "@/features/platform/components/tenant-status-form";
import type {
  PlatformTenantTab,
  PlatformTenantWorkspaceData,
} from "@/features/platform/types";
import {
  formatDate,
  formatDateTime,
  formatPlanLabel,
  formatRoleLabel,
  resolvePlatformTenantTab,
} from "@/features/platform/utils";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { cn } from "@/lib/utils";

export function TenantWorkspace({
  data,
  initialTab,
  adminDisplayName,
  adminRole,
}: {
  data: PlatformTenantWorkspaceData;
  initialTab: PlatformTenantTab;
  adminDisplayName: string;
  adminRole: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<PlatformTenantTab>(initialTab);
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const tabs: PageTabDefinition[] = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "users", label: "Users", count: data.users.length },
      { id: "branches", label: "Branches", count: data.branches.length },
      { id: "subscription", label: "Subscription" },
      { id: "activity", label: "Activity", count: data.activity.length },
    ],
    [data.users.length, data.branches.length, data.activity.length],
  );

  function changeTab(tabId: string) {
    const next = resolvePlatformTenantTab(tabId);
    setActiveTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function setStatus(status: "active" | "suspended" | "trial") {
    const formData = new FormData();
    formData.set("tenantId", data.tenant.id);
    formData.set("status", status);
    startTransition(async () => {
      await updateTenantStatusAction(INITIAL_FORM_ACTION_STATE, formData);
      router.refresh();
    });
  }

  async function copyTenantId() {
    try {
      await navigator.clipboard.writeText(data.tenant.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const trialExpired =
    data.tenant.status === "trial" &&
    data.tenant.trialEndsAt != null &&
    new Date(data.tenant.trialEndsAt).getTime() < Date.now();

  return (
    <PlatformShell
      adminDisplayName={adminDisplayName}
      adminRole={adminRole}
      showPageHeader={false}
    >
      <div className="space-y-5">
        <Link
          href="/platform"
          className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← All tenants
        </Link>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Store className="size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  {data.tenant.name}
                </h2>
                <TenantStatusBadge status={data.tenant.status} variant="table" />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {data.tenant.slug} · {data.tenant.currencyCode} · {data.tenant.timezone}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={data.branding.publicPath} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Visit public site
              </Link>
            </Button>
            <Button
              type="button"
              variant="navyPrimary"
              className="rounded-xl"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
              Edit tenant
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="rounded-xl" aria-label="More actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>More actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => changeTab("subscription")}>
                  Manage subscription
                </DropdownMenuItem>
                {data.tenant.status !== "active" ? (
                  <DropdownMenuItem disabled={pending} onSelect={() => setStatus("active")}>
                    Activate tenant
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                {data.tenant.status !== "suspended" ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setSuspendOpen(true)}
                  >
                    Suspend tenant
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled={pending} onSelect={() => setStatus("trial")}>
                    Return to trial
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <PageTabs tabs={tabs} activeTab={activeTab} onTabChange={changeTab} />
        </div>

        <PageTabPanel activeTab={activeTab} tabId="overview" className="pt-1">
          <OverviewTab
            data={data}
            trialExpired={trialExpired}
            copied={copied}
            onCopyId={copyTenantId}
            onEdit={() => setEditOpen(true)}
            onManageSubscription={() => changeTab("subscription")}
            onViewActivity={() => changeTab("activity")}
            onRequestSuspend={() => setSuspendOpen(true)}
            pending={pending}
          />
        </PageTabPanel>

        <PageTabPanel activeTab={activeTab} tabId="users" className="pt-1">
          <UsersTab users={data.users} />
        </PageTabPanel>

        <PageTabPanel activeTab={activeTab} tabId="branches" className="pt-1">
          <BranchesTab branches={data.branches} />
        </PageTabPanel>

        <PageTabPanel activeTab={activeTab} tabId="subscription" className="pt-1">
          <SubscriptionTab data={data} trialExpired={trialExpired} />
        </PageTabPanel>

        <PageTabPanel activeTab={activeTab} tabId="activity" className="pt-1">
          <ActivityTab activity={data.activity} />
        </PageTabPanel>
      </div>

      <PlatformSidePanel
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit tenant"
        description="Update shop identity settings. The tenant slug stays fixed."
      >
        <TenantEditForm
          tenantId={data.tenant.id}
          initialName={data.tenant.name}
          initialCurrencyCode={data.tenant.currencyCode}
          initialTimezone={data.tenant.timezone}
          slug={data.tenant.slug}
          onCancel={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      </PlatformSidePanel>

      <ConfirmActionDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend tenant?"
        description="Staff for this shop will not be able to sign in until the tenant is reactivated."
        confirmLabel="Suspend tenant"
        action={async () => setStatus("suspended")}
      />
    </PlatformShell>
  );
}

function OverviewTab({
  data,
  trialExpired,
  copied,
  onCopyId,
  onEdit,
  onManageSubscription,
  onViewActivity,
  onRequestSuspend,
  pending,
}: {
  data: PlatformTenantWorkspaceData;
  trialExpired: boolean;
  copied: boolean;
  onCopyId: () => void;
  onEdit: () => void;
  onManageSubscription: () => void;
  onViewActivity: () => void;
  onRequestSuspend: () => void;
  pending: boolean;
}) {
  const ownerInitials = getInitials(data.owner?.fullName ?? "NA");

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.9fr)]">
      <div className="space-y-5">
        <WorkspaceCard
          icon={CreditCard}
          title="Subscription"
          description="Plan, status, and billing details for this tenant."
          action={
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onManageSubscription}>
              Manage Subscription
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Plan" value={formatPlanLabel(data.tenant.planKey)} />
            <Metric
              label="Status"
              value={<TenantStatusBadge status={data.tenant.status} variant="table" />}
            />
            <Metric
              label="Trial ends"
              value={
                <span className={cn(trialExpired && "font-medium text-destructive")}>
                  {formatDate(data.tenant.trialEndsAt)}
                  {trialExpired ? " · Expired" : ""}
                </span>
              }
            />
            <Metric label="Billing customer" value={data.tenant.billingCustomerId ?? "—"} />
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          icon={Paintbrush}
          title="Branding"
          description="Tenant branding and public website information."
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-[#0b1f3a] p-3">
              <Image
                src={data.branding.logoSrc}
                alt={`${data.branding.appName} logo`}
                width={64}
                height={64}
                className="max-h-14 w-auto object-contain"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <InfoGrid
                rows={[
                  { label: "App name", value: data.branding.appName },
                  { label: "Company", value: data.branding.companyName },
                  {
                    label: "Public path",
                    value: (
                      <Link
                        href={data.branding.publicPath}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {data.branding.publicPath}
                      </Link>
                    ),
                  },
                ]}
              />
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={data.branding.publicPath} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Open public site
                </Link>
              </Button>
            </div>
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          icon={Building2}
          title="Branches"
          description="Registered branches for this tenant."
        >
          {data.branches.length === 0 ? (
            <EmptyCopy text="No branches registered for this tenant." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.branches.map((branch) => (
                <li key={branch.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Store className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{branch.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {branch.code}
                      {branch.address ? ` · ${branch.address}` : ""}
                    </p>
                  </div>
                  {branch.isMain ? (
                    <StatusBadge tone="success" variant="table">
                      Main
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone={branch.isActive ? "success" : "neutral"} variant="table">
                      {branch.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </WorkspaceCard>
      </div>

      <div className="space-y-5">
        <WorkspaceCard title="Tenant Information">
          <InfoGrid
            rows={[
              {
                label: "Tenant ID",
                value: (
                  <button
                    type="button"
                    onClick={onCopyId}
                    className="inline-flex max-w-full items-center gap-1.5 font-mono text-xs text-slate-700 hover:text-blue-700"
                    title="Copy tenant ID"
                  >
                    <span className="truncate">{data.tenant.id}</span>
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  </button>
                ),
              },
              { label: "Currency", value: data.tenant.currencyCode },
              { label: "Time zone", value: data.tenant.timezone },
              { label: "Date created", value: formatDate(data.tenant.createdAt) },
            ]}
          />
        </WorkspaceCard>

        <WorkspaceCard title="Owner Account">
          {data.owner ? (
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                {ownerInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{data.owner.fullName}</p>
                <p className="truncate text-sm text-slate-500">{data.owner.email ?? "No email linked"}</p>
              </div>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Edit tenant"
              >
                <Pencil className="size-4" />
              </button>
            </div>
          ) : (
            <EmptyCopy text="No owner staff account was provisioned for this tenant." />
          )}
        </WorkspaceCard>

        <WorkspaceCard title="Quick Actions">
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" className="justify-start rounded-xl" onClick={onEdit}>
              <Pencil className="size-4" />
              Edit tenant
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start rounded-xl"
              onClick={onManageSubscription}
            >
              <CreditCard className="size-4" />
              Manage subscription
            </Button>
            {data.tenant.status !== "suspended" ? (
              <Button
                type="button"
                variant="outline"
                className="justify-start rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                disabled={pending}
                onClick={onRequestSuspend}
              >
                <PauseCircle className="size-4" />
                Suspend tenant
              </Button>
            ) : null}
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          title="Recent Activity"
          action={
            <button
              type="button"
              onClick={onViewActivity}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              View all
            </button>
          }
        >
          {data.activity.length === 0 ? (
            <EmptyCopy text="No platform activity recorded for this tenant yet." />
          ) : (
            <ul className="space-y-3">
              {data.activity.slice(0, 5).map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Plus className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize text-slate-900">{item.summary}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDateTime(item.createdAt)}
                      {item.actorEmail ? ` · ${item.actorEmail}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WorkspaceCard>
      </div>
    </div>
  );
}

function UsersTab({ users }: { users: PlatformTenantWorkspaceData["users"] }) {
  if (users.length === 0) {
    return (
      <WorkspaceCard icon={Users} title="Users" description="Staff accounts linked to this tenant.">
        <EmptyCopy text="No staff users are linked to this tenant yet." />
      </WorkspaceCard>
    );
  }

  return (
    <WorkspaceCard icon={Users} title="Users" description="Staff accounts linked to this tenant." flush>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-slate-900">
                  {user.fullName}
                  {user.isOwner ? (
                    <span className="ml-2 text-xs font-medium text-slate-500">Owner</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-slate-600">{user.email ?? "—"}</TableCell>
                <TableCell className="capitalize text-slate-700">
                  {formatRoleLabel(user.role)}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    tone={user.status === "active" ? "success" : "neutral"}
                    variant="table"
                  >
                    {user.status}
                  </StatusBadge>
                </TableCell>
                <TableCell className="tabular-nums text-slate-600">
                  {formatDateTime(user.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </WorkspaceCard>
  );
}

function BranchesTab({
  branches,
}: {
  branches: PlatformTenantWorkspaceData["branches"];
}) {
  if (branches.length === 0) {
    return (
      <WorkspaceCard icon={GitBranch} title="Branches" description="Registered branches for this tenant.">
        <EmptyCopy text="No branches registered for this tenant." />
      </WorkspaceCard>
    );
  }

  return (
    <WorkspaceCard icon={GitBranch} title="Branches" description="Registered branches for this tenant." flush>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="font-medium text-slate-900">{branch.name}</TableCell>
                <TableCell>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                    {branch.code}
                  </code>
                </TableCell>
                <TableCell className="text-slate-600">{branch.address ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge tone={branch.isActive ? "success" : "neutral"} variant="table">
                    {branch.isActive ? "Active" : "Inactive"}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-slate-600">
                  {branch.isMain ? "Main" : "Branch"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </WorkspaceCard>
  );
}

function SubscriptionTab({
  data,
  trialExpired,
}: {
  data: PlatformTenantWorkspaceData;
  trialExpired: boolean;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <WorkspaceCard
        icon={CreditCard}
        title="Subscription details"
        description="Current plan and billing fields for this tenant."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Plan" value={formatPlanLabel(data.tenant.planKey)} />
          <Metric
            label="Status"
            value={<TenantStatusBadge status={data.tenant.status} variant="table" />}
          />
          <Metric
            label="Trial ends"
            value={
              <span className={cn(trialExpired && "font-medium text-destructive")}>
                {formatDate(data.tenant.trialEndsAt)}
                {trialExpired ? " · Expired" : ""}
              </span>
            }
          />
          <Metric
            label="Billing customer"
            value={data.tenant.billingCustomerId ?? "Not connected"}
          />
          <Metric label="Created" value={formatDateTime(data.tenant.createdAt)} />
          <Metric label="Updated" value={formatDateTime(data.tenant.updatedAt)} />
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Billing history and payment integrations are not connected yet. Subscription status is
          managed manually from this workspace.
        </p>
      </WorkspaceCard>

      <WorkspaceCard title="Manage subscription">
        <TenantStatusForm tenantId={data.tenant.id} currentStatus={data.tenant.status} />
      </WorkspaceCard>
    </div>
  );
}

function ActivityTab({
  activity,
}: {
  activity: PlatformTenantWorkspaceData["activity"];
}) {
  if (activity.length === 0) {
    return (
      <WorkspaceCard
        icon={ActivityIcon}
        title="Activity"
        description="Platform audit events for this tenant."
      >
        <EmptyCopy text="No tenant audit events yet. Status and profile changes made here will appear in this feed." />
      </WorkspaceCard>
    );
  }

  return (
    <WorkspaceCard
      icon={ActivityIcon}
      title="Activity"
      description="Platform audit events for this tenant."
      flush
    >
      <ul className="divide-y divide-slate-100">
        {activity.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <p className="font-medium capitalize text-slate-900">{item.summary}</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {item.actorEmail ?? "System"} · {item.entityType}
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums text-slate-500">
              {formatDateTime(item.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </WorkspaceCard>
  );
}

function WorkspaceCard({
  icon: Icon,
  title,
  description,
  action,
  children,
  flush = false,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon className="size-4" />
            </div>
          ) : null}
          <div>
            <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className={flush ? "" : "px-5 py-4"}>{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-1.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function InfoGrid({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="space-y-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <dt className="text-slate-500">{row.label}</dt>
          <dd className="max-w-[70%] text-right font-medium text-slate-900">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyCopy({ text }: { text: string }) {
  return <p className="py-2 text-sm text-slate-500">{text}</p>;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
