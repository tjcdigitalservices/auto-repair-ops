"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, User } from "lucide-react";

import {
  EntityDetailHeader,
  EntityDetailLayout,
  EntityDetailSidebar,
  EntityDetailTabPanel,
  EntityDetailTabs,
  MetadataPill,
} from "@/components/shared/entity-detail";
import { PageHeaderActions, PagePrimaryAction } from "@/components/shared/page-header-actions";
import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { CustomerDocumentsTab } from "@/features/customers/components/customer-documents-tab";
import { CustomerServiceHistoryTab } from "@/features/customers/components/customer-service-history-tab";
import type { CustomerDocumentHistoryItem } from "@/features/customers/types";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import { VehicleDetailSidebar } from "@/features/vehicles/components/vehicle-detail-sidebar";
import type { VehicleDetail } from "@/features/vehicles/types";
import { formatDate } from "@/lib/dates";

const VEHICLE_DETAIL_TABS = [
  { id: "service-history", label: "Service history" },
  { id: "documents", label: "Documents" },
] as const;

type VehicleDetailTabId = (typeof VEHICLE_DETAIL_TABS)[number]["id"];

export function VehicleDetailPageContent({
  vehicle,
  serviceHistory,
  documents,
  canViewServiceHistory,
  canManageVehicles,
  canRecordPastService,
  historicalSaved = false,
}: {
  vehicle: VehicleDetail;
  serviceHistory: ServiceHistoryEntry[];
  documents: CustomerDocumentHistoryItem[];
  canViewServiceHistory: boolean;
  canManageVehicles: boolean;
  canRecordPastService: boolean;
  historicalSaved?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = resolveVehicleDetailTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<VehicleDetailTabId>(initialTab);

  const updateTab = useCallback(
    (nextTab: VehicleDetailTabId) => {
      setActiveTab(nextTab);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("historicalSaved");

      if (nextTab === "service-history") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="space-y-6">
      {historicalSaved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Past service record saved to this vehicle&apos;s service history.
        </div>
      ) : null}

      <EntityDetailLayout
        header={
          <EntityDetailHeader
            title={`${vehicle.make} ${vehicle.model}`}
            description="Vehicle profile, linked customer, and service records."
            backHref="/vehicles"
            backLabel="Back to vehicles"
            metadata={
              <>
                <MetadataPill tone={vehicle.status === "active" ? "success" : "neutral"}>
                  {toTitleCase(vehicle.status)}
                </MetadataPill>
                {vehicle.plateNumber ? <MetadataPill>{vehicle.plateNumber}</MetadataPill> : null}
                {vehicle.year ? <MetadataPill>{vehicle.year}</MetadataPill> : null}
                <MetadataPill>Added {formatDate(vehicle.createdAt)}</MetadataPill>
              </>
            }
            actions={
              canManageVehicles ? (
                <PageHeaderActions
                  primary={
                    <PagePrimaryAction href={`/vehicles/${vehicle.id}/edit`}>
                      Edit Vehicle
                    </PagePrimaryAction>
                  }
                  overflow={
                    <TableRowActionsMenu label="Vehicle actions" variant="page">
                      <TableRowActionsMenuLink
                        href={`/customers/${vehicle.customerId}`}
                        label="View customer"
                        icon={User}
                      />
                      {canRecordPastService ? (
                        <TableRowActionsMenuLink
                          href={`/vehicles/${vehicle.id}/past-service/new`}
                          label="Record past service"
                          icon={CalendarClock}
                        />
                      ) : null}
                    </TableRowActionsMenu>
                  }
                />
              ) : (
                <PageHeaderActions
                  overflow={
                    <TableRowActionsMenu label="Vehicle actions" variant="page">
                      <TableRowActionsMenuLink
                        href={`/customers/${vehicle.customerId}`}
                        label="View customer"
                        icon={User}
                      />
                      {canRecordPastService ? (
                        <TableRowActionsMenuLink
                          href={`/vehicles/${vehicle.id}/past-service/new`}
                          label="Record past service"
                          icon={CalendarClock}
                        />
                      ) : null}
                    </TableRowActionsMenu>
                  }
                />
              )
            }
          />
        }
        sidebar={
          <EntityDetailSidebar>
            <VehicleDetailSidebar vehicle={vehicle} />
          </EntityDetailSidebar>
        }
      >
        <EntityDetailTabs
          tabs={[...VEHICLE_DETAIL_TABS]}
          activeTab={activeTab}
          onTabChange={(tabId) => updateTab(tabId as VehicleDetailTabId)}
        />

        <EntityDetailTabPanel activeTab={activeTab} tabId="service-history" className="pt-6">
          <CustomerServiceHistoryTab
            entries={serviceHistory}
            canViewServiceHistory={canViewServiceHistory}
            hideVehicleContext
          />
        </EntityDetailTabPanel>

        <EntityDetailTabPanel activeTab={activeTab} tabId="documents" className="pt-6">
          <CustomerDocumentsTab documents={documents} hideVehicleContext />
        </EntityDetailTabPanel>
      </EntityDetailLayout>
    </div>
  );
}

function resolveVehicleDetailTab(tab: string | null): VehicleDetailTabId {
  if (tab === "documents") {
    return tab;
  }

  return "service-history";
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
