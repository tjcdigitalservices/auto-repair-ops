"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  Car,
  LogOut,
  Settings,
  Store,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/platform",
    label: "Tenants",
    icon: Store,
    match: (pathname: string) =>
      pathname === "/platform" || pathname.startsWith("/platform/tenants"),
  },
  {
    href: "/platform/settings",
    label: "Platform Settings",
    icon: Settings,
    soon: true,
  },
  {
    href: "/platform/billing",
    label: "Usage & Billing",
    icon: BarChart3,
    soon: true,
  },
  {
    href: "/platform/users",
    label: "Platform Users",
    icon: Users,
    soon: true,
  },
  {
    href: "/platform/activity",
    label: "Activity Logs",
    icon: Activity,
    soon: true,
  },
] as const;

export function PlatformShell({
  adminDisplayName,
  adminRole,
  showPageHeader = true,
  children,
}: {
  adminDisplayName: string;
  adminRole: string;
  showPageHeader?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const initials = getInitials(adminDisplayName);

  return (
    <div className="min-h-screen bg-[#eef2f7] lg:flex">
      <aside className="flex w-full flex-col bg-[#0b1f3a] text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <Car className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">Auto Repair Ops</p>
            <p className="truncate text-[11px] text-white/55">Platform Administration</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              "match" in item && item.match
                ? item.match(pathname)
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const soon = "soon" in item && item.soon;

            if (soon) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/40"
                  title="Coming soon"
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-[#1d4ed8] font-medium text-white shadow-lg shadow-blue-950/30"
                    : "text-white/70 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#1d4ed8] text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{adminDisplayName}</p>
              <p className="truncate text-[11px] capitalize text-white/50">
                {adminRole.replaceAll("_", " ")}
              </p>
            </div>
            <Building2 className="size-4 text-white/35" />
          </div>
          <form action={signOutAction} className="mt-3">
            <Button
              type="submit"
              variant="outline"
              className="h-9 w-full justify-start gap-2 rounded-xl border-white/15 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {showPageHeader ? (
          <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="px-4 py-5 sm:px-6 lg:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Platform
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Super Admin
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage auto repair shop tenants on this platform.
              </p>
            </div>
          </header>
        ) : null}
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
