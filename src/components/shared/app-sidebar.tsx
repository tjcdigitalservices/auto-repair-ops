'use client';

import { AppLink } from '@/components/shared/app-link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  CalendarClock,
  CarFront,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings2,
  ShoppingCart,
  ScanSearch,
  HandCoins,
  Truck,
  Users,
  UserSquare2,
  Globe,
  Wrench,
  WalletCards,
  X,
} from 'lucide-react';

import { DEFAULT_BRAND_LOGO_TIGHT_SRC } from '@/components/shared/brand-assets';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/shared/brand-logo';
import {
  navigationItemMatchesPath,
  resolveActiveNavigationItem,
  type NavigationGroup,
  type NavigationIconName,
} from '@/lib/navigation';
import { cn } from '@/lib/utils';

const ICONS: Record<
  NavigationIconName,
  React.ComponentType<{ className?: string }>
> = {
  dashboard: LayoutDashboard,
  'quick-access': ScanSearch,
  customers: Users,
  vehicles: CarFront,
  quotations: FileText,
  bookings: CalendarClock,
  documents: FileText,
  'job-orders': ClipboardList,
  inventory: Boxes,
  products: Package,
  services: Wrench,
  suppliers: Truck,
  invoices: ReceiptText,
  payments: WalletCards,
  pos: ShoppingCart,
  staff: UserSquare2,
  attendance: Clock3,
  payroll: HandCoins,
  reports: BarChart3,
  website: Globe,
  settings: Settings2,
};

function sidebarNavLinkClassName({
  collapsed,
  isActive,
}: {
  collapsed: boolean;
  isActive: boolean;
}) {
  // Keep this as a stable string join (no twMerge) so server/client classNames
  // stay byte-identical during hydration.
  return [
    'group flex min-h-10 rounded-xl text-sm font-medium transition-colors',
    collapsed ? 'justify-center px-2 py-2' : 'items-center gap-2.5 px-2.5 py-2',
    isActive
      ? 'bg-brand-navy text-white shadow-[0_10px_20px_-16px_hsl(var(--brand-navy)/0.85)]'
      : 'text-slate-600 hover:bg-slate-100 hover:text-brand-navy',
  ].join(' ');
}

export function AppSidebar({
  navigationItems,
  businessName,
  businessLogoUrl,
  businessMarkUrl,
  showBusinessName = false,
  collapsed = false,
  className,
  onNavigate,
  onClose,
  onToggleCollapse,
  showCloseButton = false,
  showCollapseButton = false,
}: {
  navigationItems: ReadonlyArray<{
    href: string;
    label: string;
    description?: string;
    group: NavigationGroup;
    iconName: NavigationIconName;
    showInSidebar?: boolean;
    showAsMobileShortcut?: boolean;
  }>;
  businessName: string;
  businessLogoUrl: string | null;
  businessMarkUrl?: string | null;
  showBusinessName?: boolean;
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  showCloseButton?: boolean;
  showCollapseButton?: boolean;
}) {
  const pathname = usePathname();
  const mobileShortcutItems = navigationItems.filter(
    (item) => item.showAsMobileShortcut,
  );
  const activeItem = resolveActiveNavigationItem(navigationItems, pathname);

  const groupedItems = navigationItems.reduce<
    Record<NavigationGroup, typeof navigationItems>
  >(
    (groups, item) => {
      if (item.showInSidebar === false) {
        return groups;
      }

      const existing = groups[item.group] ?? [];
      groups[item.group] = [...existing, item];
      return groups;
    },
    {
      Overview: [],
      'Service Desk': [],
      'Stock & Catalog': [],
      Billing: [],
      People: [],
      Insights: [],
      System: [],
    },
  );

  return (
    <aside
      className={cn(
        'overflow-visible border-r border-border/70 bg-background/95 shadow-[inset_-1px_0_0_rgba(15,23,42,0.04)] backdrop-blur',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-full flex-col py-3',
          collapsed ? 'px-2' : 'px-2.5',
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between gap-2 border-b border-border/70',
            collapsed ? 'pb-2.5' : showBusinessName ? 'pb-3' : 'pb-2.5',
          )}
        >
          <div className="min-w-0 flex-1">
            {collapsed ? (
              <div className="flex min-h-[3.5rem] items-center justify-center py-0.5">
                <BrandLogo
                  src={businessMarkUrl}
                  alt={`${businessName} mark`}
                  variant="mark"
                  width={80}
                  height={80}
                  className="size-[3.25rem] object-contain"
                  priority
                  fallbackClassName="size-[3.25rem]"
                />
              </div>
            ) : showBusinessName ? (
              <div className="flex items-start gap-2.5">
                <div className="flex min-h-[3.25rem] shrink-0 items-center py-0.5">
                  <BrandLogo
                    src={businessLogoUrl ?? DEFAULT_BRAND_LOGO_TIGHT_SRC}
                    alt={businessName}
                    width={272}
                    height={84}
                    className="h-auto w-[11.5rem] object-contain object-left mix-blend-multiply"
                    priority
                    fallbackClassName="w-[11.5rem]"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                    Operations
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
                    {businessName}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[3.5rem] w-full items-center py-0.5 pl-0.5 pr-1">
                <BrandLogo
                  src={businessLogoUrl ?? DEFAULT_BRAND_LOGO_TIGHT_SRC}
                  alt={businessName}
                  width={660}
                  height={188}
                  className="h-auto w-full max-w-[12.5rem] object-contain object-left mix-blend-multiply"
                  priority
                  fallbackClassName="w-full max-w-[12.5rem]"
                />
              </div>
            )}
          </div>
          {showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-2xl border border-border/70 bg-background md:hidden"
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        <nav
          className={cn(
            'mt-2 flex-1 overflow-y-auto',
            collapsed ? 'pr-0' : 'pr-0.5',
          )}
        >
          <div className={cn(collapsed ? 'space-y-3' : 'space-y-3.5')}>
            {Object.entries(groupedItems)
              .filter(([, items]) => items.length > 0)
              .map(([group, items]) => (
                <div
                  key={group}
                  className={cn(collapsed ? 'space-y-1' : 'space-y-1')}
                >
                  {showCloseButton &&
                  group === 'Overview' &&
                  mobileShortcutItems.length > 0 &&
                  !collapsed ? (
                    <div className="space-y-1.5 pb-0.5">
                      {mobileShortcutItems.map((item) => {
                        const Icon = ICONS[item.iconName];

                        return (
                          <AppLink
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className="flex min-h-10 w-full items-center gap-2.5 rounded-xl bg-brand-navy px-2.5 py-2 text-left text-sm font-medium text-white shadow-[0_12px_24px_-18px_hsl(var(--brand-navy)/0.8)] transition-colors hover:bg-brand-navyHover"
                          >
                            <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
                              <Icon className="size-[18px]" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate">{item.label}</p>
                              <p className="mt-0.5 truncate text-xs font-normal text-primary-foreground/75">
                                {item.description ?? "Look up a customer or vehicle."}
                              </p>
                            </div>
                          </AppLink>
                        );
                      })}
                    </div>
                  ) : null}
                  {collapsed ? (
                    <div className="mx-auto h-px w-7 bg-border/70" />
                  ) : (
                    <p className="px-2.5 pb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
                      {group}
                    </p>
                  )}
                  <div className={cn(collapsed ? 'space-y-0.5' : 'space-y-0.5')}>
                    {items.map((item) => {
                      const Icon = ICONS[item.iconName];
                      const isActive =
                        activeItem?.href === item.href &&
                        navigationItemMatchesPath(item.href, pathname);
                      const purposeLabel =
                        item.href === "/quick-access" && item.description
                          ? `${item.label}. ${item.description}`
                          : item.label;
                      const showPurposeSubtitle =
                        !collapsed && item.href === "/quick-access" && Boolean(item.description);

                      return (
                        <AppLink
                          key={item.href}
                          href={item.href}
                          onClick={onNavigate}
                          aria-label={purposeLabel}
                          title={item.description ?? item.label}
                          className={sidebarNavLinkClassName({ collapsed, isActive })}
                        >
                          <span
                            suppressHydrationWarning
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                              isActive
                                ? 'bg-white/15 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-brand-navy',
                            )}
                          >
                            <Icon className="size-[18px]" />
                          </span>
                          {!collapsed ? (
                            showPurposeSubtitle ? (
                              <span className="min-w-0">
                                <span className="block truncate font-medium leading-tight">
                                  {item.label}
                                </span>
                                <span
                                  className={cn(
                                    "mt-0.5 block truncate text-xs font-normal leading-snug",
                                    isActive ? "text-white/75" : "text-muted-foreground",
                                  )}
                                >
                                  {item.description}
                                </span>
                              </span>
                            ) : (
                              <span className="truncate font-medium leading-tight">
                                {item.label}
                              </span>
                            )
                          ) : null}
                        </AppLink>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </nav>

        <div className="relative mt-3 border-t border-border/60 px-1 pt-2.5">
          {!collapsed ? (
            <p className="truncate text-xs font-medium text-muted-foreground">
              {businessName || "Admin"}
            </p>
          ) : (
            <div className="h-6" aria-hidden="true" />
          )}
          {showCollapseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'absolute right-[-0.75rem] top-1/2 z-10 size-9 -translate-y-1/2 rounded-full border-2 border-white bg-brand-navy text-white shadow-lg transition-all hover:scale-[1.03] hover:bg-brand-navyHover',
                collapsed ? 'bg-brand-navyHover' : 'bg-brand-navy',
              )}
            >
              {collapsed ? (
                <ChevronRight className="size-3.5" />
              ) : (
                <ChevronLeft className="size-3.5" />
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
