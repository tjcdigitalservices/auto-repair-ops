"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppTopbar } from "@/components/shared/app-topbar";
import { PageContainer } from "@/components/shared/page-container";
import type { AppCapability } from "@/lib/auth/permissions";
import {
  resolveActiveNavigationItem,
  type NavigationGroup,
  type NavigationIconName,
} from "@/lib/navigation";

const SIDEBAR_COLLAPSE_STORAGE_KEY = "say-admin-sidebar-collapsed";
const TABLET_SIDEBAR_MEDIA_QUERY = "(min-width: 768px) and (max-width: 1023px)";
const DESKTOP_SIDEBAR_EXPANDED_WIDTH = "w-[15rem]";
const DESKTOP_SIDEBAR_COLLAPSED_WIDTH = "w-[5.75rem]";
const DESKTOP_CONTENT_EXPANDED_CLASS = "md:pl-[15rem]";
const DESKTOP_CONTENT_COLLAPSED_CLASS = "md:pl-[5.75rem]";

export function AppShell({
  children,
  navigationItems,
  userDisplayName,
  userRoleLabel,
  capabilities,
  businessName,
  businessLogoUrl,
  businessMarkUrl,
  showSidebarBusinessName = false,
}: Readonly<{
  children: React.ReactNode;
  navigationItems: ReadonlyArray<{
    href: string;
    label: string;
    description: string;
    group: NavigationGroup;
    iconName: NavigationIconName;
    showInSidebar?: boolean;
    showAsMobileShortcut?: boolean;
  }>;
  userDisplayName: string;
  userRoleLabel: string;
  capabilities: readonly AppCapability[];
  businessName: string;
  businessLogoUrl: string | null;
  businessMarkUrl?: string | null;
  showSidebarBusinessName?: boolean;
}>) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const activeItem = resolveActiveNavigationItem(navigationItems, pathname);
  void capabilities;

  useEffect(() => {
    // Restore collapse preference only after hydration so the first client
    // paint matches the server (always expanded).
    setIsDesktopSidebarCollapsed(resolveInitialSidebarCollapsed());
    setHasHydrated(true);
  }, []);

  function handleToggleDesktopSidebar() {
    setIsDesktopSidebarCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(
          SIDEBAR_COLLAPSE_STORAGE_KEY,
          String(next),
        );
      } catch {
        // Ignore storage failures and keep the UI responsive.
      }

      return next;
    });
  }

  // Until hydration completes, always render the expanded chrome so SSR HTML
  // and the first client render share identical sidebar link classNames.
  const collapsedForRender = hasHydrated && isDesktopSidebarCollapsed;

  const desktopSidebarWidth = collapsedForRender
    ? DESKTOP_SIDEBAR_COLLAPSED_WIDTH
    : DESKTOP_SIDEBAR_EXPANDED_WIDTH;

  return (
    // Continuous chrome for short empty lists; cards stay content-sized (no flex-1/min-h on main).
    <div className="relative min-h-svh bg-slate-50">
      <div
        className={`absolute inset-y-0 left-0 z-20 hidden md:block ${desktopSidebarWidth}`}
      >
        <div className="sticky top-0 flex h-svh max-h-full flex-col">
          <AppSidebar
            navigationItems={navigationItems}
            businessName={businessName}
            businessLogoUrl={businessLogoUrl}
            businessMarkUrl={businessMarkUrl}
            showBusinessName={showSidebarBusinessName}
            collapsed={collapsedForRender}
            onToggleCollapse={handleToggleDesktopSidebar}
            showCollapseButton
            className="no-print flex h-full min-h-0 w-full flex-col"
          />
        </div>
      </div>
      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" aria-hidden="true">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/35"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Dismiss navigation overlay"
          />
        </div>
      ) : null}
      {isMobileSidebarOpen ? (
        <AppSidebar
          navigationItems={navigationItems}
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
          businessMarkUrl={businessMarkUrl}
          showBusinessName={showSidebarBusinessName}
          className="no-print fixed inset-y-0 left-0 z-50 flex w-[15rem] max-w-[calc(100vw-2rem)] flex-col shadow-2xl md:hidden"
          onNavigate={() => setIsMobileSidebarOpen(false)}
          onClose={() => setIsMobileSidebarOpen(false)}
          showCloseButton
        />
      ) : null}
      <div
        className={`min-w-0 overflow-x-hidden ${collapsedForRender ? DESKTOP_CONTENT_COLLAPSED_CLASS : DESKTOP_CONTENT_EXPANDED_CLASS}`}
        style={
          {
            "--app-sidebar-offset": collapsedForRender ? "5.75rem" : "15rem",
          } as React.CSSProperties
        }
      >
        <div className="no-print">
          <AppTopbar
            activeLabel={activeItem?.label ?? "Dashboard"}
            userDisplayName={userDisplayName}
            userRoleLabel={userRoleLabel}
            capabilities={capabilities}
            onOpenNavigation={() => setIsMobileSidebarOpen(true)}
          />
        </div>
        <main className="min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}

function resolveInitialSidebarCollapsed() {
  try {
    const storedValue = window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);

    if (storedValue === "true" || storedValue === "false") {
      return storedValue === "true";
    }

    return window.matchMedia(TABLET_SIDEBAR_MEDIA_QUERY).matches;
  } catch {
    return false;
  }
}
