"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions } from "@/components/shared/page-header-actions";
import { Button } from "@/components/ui/button";
import { QuickAccessPlateNotFound } from "@/features/quick-access/components/quick-access-plate-not-found";
import { QuickAccessResultsWorkspace } from "@/features/quick-access/components/quick-access-results-workspace";
import { QuickAccessSearchDialog } from "@/features/quick-access/components/quick-access-search-dialog";
import { buildQuickAccessNoMatchRedirectPath } from "@/features/quick-access/utils";
import type { QuickAccessSearchState } from "@/features/quick-access/types";

export function QuickAccessPageClient({
  searchState,
}: {
  searchState: QuickAccessSearchState;
}) {
  const router = useRouter();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const hasSearch = Boolean(
    searchState.plateQuery ||
      searchState.customerLastNameQuery ||
      (searchState.intakeCustomerId && searchState.intakeVehicleId),
  );
  const hasResults = searchState.records.length > 0;
  const isPlateNotFound = Boolean(searchState.plateQuery && hasSearch && !hasResults);
  const customerNotFound = Boolean(searchState.customerLastNameQuery && hasSearch && !hasResults);
  const lookupLabel =
    searchState.plateQuery || searchState.customerLastNameQuery || "Lookup results";

  const quotationFallbackHref =
    customerNotFound && searchState.permissions.canCreateQuotations
      ? buildQuickAccessNoMatchRedirectPath({
          plateQuery: "",
          customerLastNameQuery: searchState.customerLastNameQuery,
          canCreateVehicle: false,
          canCreateQuotation: true,
        })
      : null;

  function clearSearch() {
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <PageHeader
        title={lookupLabel}
        description="Continue the next workshop step for this customer or vehicle."
        actions={
          <PageHeaderActions
            primary={
              <Button type="button" variant="outline" onClick={clearSearch}>
                Clear lookup
              </Button>
            }
            overflow={
              <Button type="button" variant="ghost" onClick={() => setSearchDialogOpen(true)}>
                Advanced lookup
              </Button>
            }
          />
        }
      />

      {hasResults ? (
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
