"use client";

import { cn } from "@/lib/utils";

export type PageTabDefinition = {
  id: string;
  label: string;
  count?: number;
};

export function formatPageTabLabel(label: string, count?: number) {
  if (count === undefined) {
    return label;
  }

  return `${label} (${count})`;
}

export function PageTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  sticky = false,
}: {
  tabs: PageTabDefinition[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b border-border/70",
        sticky && "sticky top-0 z-10 bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      <div
        role="tablist"
        className="flex gap-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-state={isActive ? "active" : "inactive"}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative shrink-0 border-b-2 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-brand-navy text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <span className="ml-1.5 text-xs font-normal tabular-nums text-muted-foreground">
                  ({tab.count})
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PageTabPanel({
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
  if (activeTab !== tabId) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={cn("animate-in fade-in-0 space-y-3 pt-4 duration-200", className)}
    >
      {children}
    </div>
  );
}

export function PageTabToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}
