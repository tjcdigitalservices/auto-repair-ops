'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import type { ArrivalQueueItem } from '@/features/quick-access/arrivals/arrival-queue-types';
import { ArrivalQueueSetupNotice } from '@/features/quick-access/components/arrival-queue-setup-notice';
import {
  ActiveIntakeBanner,
  ActiveIntakeFinishedNotice,
} from '@/features/quick-access/components/active-intake-banner';
import { QuickAccessPlateNotFound } from '@/features/quick-access/components/quick-access-plate-not-found';
import { QuickAccessResultsWorkspace } from '@/features/quick-access/components/quick-access-results-workspace';
import { QuickAccessSearchArrivalPanel } from '@/features/quick-access/components/quick-access-search-arrival-panel';
import { QuickAccessSearchDialog } from '@/features/quick-access/components/quick-access-search-dialog';
import { QuickAccessSearchField } from '@/features/quick-access/components/quick-access-search-field';
import { QuickAccessIntakeRestore } from '@/features/quick-access/components/quick-access-intake-sync';
import { QuickAccessScannerProvider, useQuickAccessScanner } from '@/features/quick-access/components/quick-access-scanner-context';
import {
  PostFinishIntakePrompt,
  TodaysArrivalsSection,
} from '@/features/quick-access/components/todays-arrivals-section';
import { ActiveIntakeProvider, useActiveIntake } from '@/features/quick-access/intake/active-intake-provider';
import { buildQuickAccessNoMatchRedirectPath } from '@/features/quick-access/utils';
import type { QuickAccessSearchState } from '@/features/quick-access/types';

export function QuickAccessPageClient({
  searchState,
  arrivals,
  queueAvailable,
  finished,
  focusVehicleId,
  arrivalSourceFromScan,
  showQueueView,
}: {
  searchState: QuickAccessSearchState;
  arrivals: ArrivalQueueItem[];
  queueAvailable: boolean;
  finished?: boolean;
  focusVehicleId?: string | null;
  arrivalSourceFromScan?: boolean;
  showQueueView?: boolean;
}) {
  return (
    <ActiveIntakeProvider>
      <QuickAccessScannerProvider>
        <QuickAccessPageContent
          searchState={searchState}
          arrivals={arrivals}
          queueAvailable={queueAvailable}
          finished={Boolean(finished)}
          focusVehicleId={focusVehicleId ?? null}
          arrivalSourceFromScan={Boolean(arrivalSourceFromScan)}
          showQueueView={Boolean(showQueueView)}
        />
      </QuickAccessScannerProvider>
    </ActiveIntakeProvider>
  );
}

function QuickAccessPageContent({
  searchState,
  arrivals,
  queueAvailable,
  finished,
  focusVehicleId,
  arrivalSourceFromScan,
  showQueueView,
}: {
  searchState: QuickAccessSearchState;
  arrivals: ArrivalQueueItem[];
  queueAvailable: boolean;
  finished: boolean;
  focusVehicleId: string | null;
  arrivalSourceFromScan: boolean;
  showQueueView: boolean;
}) {
  const { session } = useActiveIntake();
  const { requestScanner } = useQuickAccessScanner();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("addArrival") === "1") {
      setSearchDialogOpen(true);
    }
  }, []);

  const hasSearch = Boolean(
    searchState.plateQuery ||
      searchState.customerLastNameQuery ||
      searchState.intakeCustomerId,
  );
  const hasResults = searchState.records.length > 0;
  const initialQuery = searchState.plateQuery || searchState.customerLastNameQuery;
  const isPlateNotFound = Boolean(searchState.plateQuery && hasSearch && !hasResults);
  const customerNotFound = Boolean(searchState.customerLastNameQuery && hasSearch && !hasResults);

  const quotationFallbackHref =
    customerNotFound && searchState.permissions.canCreateQuotations
      ? buildQuickAccessNoMatchRedirectPath({
          plateQuery: '',
          customerLastNameQuery: searchState.customerLastNameQuery,
          canCreateVehicle: false,
          canCreateQuotation: true,
        })
      : null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col gap-4">
      <QuickAccessIntakeRestore
        sessionCustomerId={searchState.intakeCustomerId}
        sessionVehicleId={searchState.intakeVehicleId}
        hasSearchResults={hasResults}
      />

      <PageHeader
        title="Quick Access"
        description="Reception dashboard for today's arrivals, intake, and workshop workflow."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />

      <div className="sticky top-0 z-30 -mx-1 space-y-3 bg-muted/20 px-1 pb-3 pt-1 backdrop-blur-md">
        <ArrivalQueueSetupNotice show={!queueAvailable} />

        <TodaysArrivalsSection
          items={arrivals}
          focusVehicleId={focusVehicleId}
          onManualAdd={() => setSearchDialogOpen(true)}
        />

        <QuickAccessSearchField key={initialQuery} initialQuery={initialQuery} />

        {session ? <ActiveIntakeBanner /> : null}
      </div>

      {finished ? (
        <div className="space-y-3">
          <ActiveIntakeFinishedNotice show />
          <PostFinishIntakePrompt items={arrivals} onScanNext={requestScanner} />
        </div>
      ) : null}

      {hasResults && !finished ? (
        <>
          <QuickAccessSearchArrivalPanel
            records={searchState.records}
            arrivals={arrivals}
            plateQuery={searchState.plateQuery}
            autoAddSource={arrivalSourceFromScan ? 'plate_scanner' : null}
          />
          <QuickAccessResultsWorkspace
            key={`${searchState.plateQuery}:${searchState.customerLastNameQuery}:${searchState.intakeVehicleId}`}
            records={searchState.records}
            plateQuery={searchState.plateQuery}
            customerLastNameQuery={searchState.customerLastNameQuery}
            canCreateQuotations={searchState.permissions.canCreateQuotations}
            canViewQuotations={searchState.permissions.canViewQuotations}
            canViewServiceHistory={searchState.permissions.canViewServiceHistory}
            canRecordPastService={searchState.permissions.canRecordPastService}
            permissions={searchState.permissions}
          />
        </>
      ) : null}

      {!hasSearch && !session && !finished && queueAvailable && arrivals.length === 0 ? (
        <EmptyState
          title="No arrivals yet today"
          description="Search, scan a plate, or manually add a vehicle to start Today's Arrivals."
          action={
            <Button type="button" variant="outline" onClick={() => setSearchDialogOpen(true)}>
              Manual add arrival
            </Button>
          }
        />
      ) : null}

      {isPlateNotFound ? (
        <QuickAccessPlateNotFound
          plateQuery={searchState.plateQuery}
          canCreateVehicle={searchState.permissions.canCreateVehicle}
        />
      ) : null}

      {customerNotFound ? (
        <EmptyState
          title="No record matched that lookup"
          description={`No customer matched "${searchState.customerLastNameQuery}". Try another spelling or search by plate instead.`}
          action={
            quotationFallbackHref ? (
              <Button asChild variant="bluePrimary">
                <Link href={quotationFallbackHref}>Start quotation</Link>
              </Button>
            ) : null
          }
        />
      ) : null}

      <QuickAccessSearchDialog
        initialPlate={searchState.plateQuery}
        initialCustomerLastName={searchState.customerLastNameQuery}
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
      />
    </div>
  );
}
