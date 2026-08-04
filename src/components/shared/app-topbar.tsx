'use client';

import { useId } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CarFront, FileText, Menu, Plus, UserPlus } from 'lucide-react';

import {
  GlobalLookupSearch,
  useSyncedGlobalLookupQuery,
} from '@/components/shared/global-lookup-search';
import { UserAccountMenu } from '@/components/shared/user-account-menu';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppCapability } from '@/lib/auth/permissions';

function canUseGlobalLookup(capabilities: readonly AppCapability[]) {
  return (
    capabilities.includes('vehicles:read') && capabilities.includes('customers:read')
  );
}

export function AppTopbar({
  activeLabel,
  userDisplayName,
  userRoleLabel,
  capabilities,
  onOpenNavigation,
}: {
  activeLabel: string;
  userDisplayName: string;
  userRoleLabel: string;
  capabilities: readonly AppCapability[];
  onOpenNavigation?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputBaseId = useId();
  const [searchQuery, setSearchQuery] = useSyncedGlobalLookupQuery(
    pathname,
    searchParams.get('q'),
  );
  const createActions = buildCreateActions(capabilities);
  const showGlobalLookup = canUseGlobalLookup(capabilities);
  const headerLabel = pathname.startsWith('/quick-access') ? 'Lookup' : activeLabel;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-3 md:hidden">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0 rounded-2xl border border-border/70 bg-background shadow-sm"
              onClick={onOpenNavigation}
              aria-label="Toggle sidebar"
            >
              <Menu className="size-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary/75">
                Workspace
              </p>
              <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">{headerLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreateActionsMenu actions={createActions} />
            <UserAccountMenu userDisplayName={userDisplayName} userRoleLabel={userRoleLabel} compact />
          </div>
        </div>

        {showGlobalLookup ? (
          <div className="md:hidden">
            <GlobalLookupSearch
              inputId={`${searchInputBaseId}-mobile`}
              value={searchQuery}
              onValueChange={setSearchQuery}
              showCamera
            />
          </div>
        ) : null}

        <div className="hidden items-center justify-between gap-6 md:flex">
          <div className="min-w-0 flex-1">
            {showGlobalLookup ? (
              <div className="w-full max-w-2xl">
                <GlobalLookupSearch
                  inputId={`${searchInputBaseId}-desktop`}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  showCamera
                />
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary/75">
                  Workspace
                </p>
                <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">{headerLabel}</p>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CreateActionsMenu actions={createActions} />
            <UserAccountMenu userDisplayName={userDisplayName} userRoleLabel={userRoleLabel} />
          </div>
        </div>
      </div>
    </header>
  );
}

function CreateActionsMenu({
  actions,
}: {
  actions: ReadonlyArray<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}) {
  const router = useRouter();

  if (actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="navyPrimary"
          className="h-10 rounded-full px-3"
          aria-label="Create new"
          title="Create new"
        >
          <span className="hidden text-sm font-semibold sm:inline">New</span>
          <Plus className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <DropdownMenuItem
              key={action.href}
              onSelect={() => router.push(action.href)}
            >
              <Icon className="size-4" />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildCreateActions(capabilities: readonly AppCapability[]) {
  const actions: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [];

  if (capabilities.includes('quotations:write')) {
    actions.push({
      href: '/quotations/new',
      label: 'New quotation',
      icon: FileText,
    });
  }

  if (capabilities.includes('customers:write')) {
    actions.push({
      href: '/customers/new',
      label: 'New customer',
      icon: UserPlus,
    });
  }

  if (capabilities.includes('vehicles:write')) {
    actions.push({
      href: '/vehicles/new',
      label: 'New vehicle',
      icon: CarFront,
    });
  }

  return actions;
}
