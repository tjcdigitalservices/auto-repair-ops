"use client";

import { PageTabPanel, PageTabs } from "@/components/shared/page-tabs";
import { cn } from "@/lib/utils";

export function EntityDetailTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) {
  return (
    <PageTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      sticky
      className={cn("-mx-1 px-1", className)}
    />
  );
}

export function EntityDetailTabPanel({
  activeTab,
  tabId,
  children,
  className,
}: {
  activeTab: string;
  tabId: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PageTabPanel activeTab={activeTab} tabId={tabId} className={cn("pt-6", className)}>
      {children}
    </PageTabPanel>
  );
}
