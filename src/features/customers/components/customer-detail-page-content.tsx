"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Car } from "lucide-react";

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
import { CustomerDetailSidebar } from "@/features/customers/components/customer-detail-sidebar";
import { CustomerDocumentsTab } from "@/features/customers/components/customer-documents-tab";
import { CustomerServiceHistoryTab } from "@/features/customers/components/customer-service-history-tab";
import { CustomerVehiclesTab } from "@/features/customers/components/customer-vehicles-tab";
import type { CustomerDetail } from "@/features/customers/types";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import { formatDate } from "@/lib/dates";

const CUSTOMER_DETAIL_TABS = [
  { id: "vehicles", label: "Vehicles" },
  { id: "service-history", label: "Service history" },
  { id: "documents", label: "Documents" },
] as const;

type CustomerDetailTabId = (typeof CUSTOMER_DETAIL_TABS)[number]["id"];

export function CustomerDetailPageContent({
  customer,
  serviceHistory,
  canViewServiceHistory,
}: {
  customer: CustomerDetail;
  serviceHistory: ServiceHistoryEntry[];
  canViewServiceHistory: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = resolveCustomerDetailTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<CustomerDetailTabId>(initialTab);

  const lastServiceByVehicleId = useMemo(
    () => buildLastServiceByVehicleId(serviceHistory),
    [serviceHistory],
  );

  const updateTab = useCallback(
    (nextTab: CustomerDetailTabId) => {
      setActiveTab(nextTab);

      const params = new URLSearchParams(searchParams.toString());

      if (nextTab === "vehicles") {
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
    <EntityDetailLayout
      header={
        <EntityDetailHeader
          title={customer.displayName}
          description="Customer profile, linked vehicles and service records."
          backHref="/customers"
          backLabel="Back to customers"
          metadata={
            <>
              <MetadataPill tone={customer.status === "active" ? "success" : "neutral"}>
                {toTitleCase(customer.status)}
              </MetadataPill>
              <MetadataPill>{toTitleCase(customer.customerType.replace("_", " "))}</MetadataPill>
              {customer.companyName ? (
                <MetadataPill tone="info">Fleet customer</MetadataPill>
              ) : null}
              <MetadataPill>Member since {formatDate(customer.createdAt)}</MetadataPill>
            </>
          }
          actions={
            <PageHeaderActions
              primary={
                <PagePrimaryAction href={`/customers/${customer.id}/edit`}>
                  Edit Customer
                </PagePrimaryAction>
              }
              overflow={
                <TableRowActionsMenu label="Customer actions" variant="page">
                  <TableRowActionsMenuLink
                    href={`/vehicles/new?customerId=${customer.id}`}
                    label="Add vehicle"
                    icon={Car}
                  />
                </TableRowActionsMenu>
              }
            />
          }
        />
      }
      sidebar={
        <EntityDetailSidebar>
          <CustomerDetailSidebar customer={customer} />
        </EntityDetailSidebar>
      }
    >
      <EntityDetailTabs
        tabs={[...CUSTOMER_DETAIL_TABS]}
        activeTab={activeTab}
        onTabChange={(tabId) => updateTab(tabId as CustomerDetailTabId)}
      />

      <EntityDetailTabPanel activeTab={activeTab} tabId="vehicles" className="pt-6">
        <CustomerVehiclesTab
          vehicles={customer.vehicles}
          lastServiceByVehicleId={lastServiceByVehicleId}
        />
      </EntityDetailTabPanel>

      <EntityDetailTabPanel activeTab={activeTab} tabId="service-history" className="pt-6">
        <CustomerServiceHistoryTab
          entries={serviceHistory}
          canViewServiceHistory={canViewServiceHistory}
        />
      </EntityDetailTabPanel>

      <EntityDetailTabPanel activeTab={activeTab} tabId="documents" className="pt-6">
        <CustomerDocumentsTab documents={customer.documentHistory} />
      </EntityDetailTabPanel>
    </EntityDetailLayout>
  );
}

function buildLastServiceByVehicleId(entries: ServiceHistoryEntry[]) {
  return entries.reduce<Record<string, string>>((result, entry) => {
    const current = result[entry.vehicleId];

    if (!current || Date.parse(entry.serviceDate) > Date.parse(current)) {
      result[entry.vehicleId] = entry.serviceDate;
    }

    return result;
  }, {});
}

function resolveCustomerDetailTab(tab: string | null): CustomerDetailTabId {
  if (tab === "service-history" || tab === "documents") {
    return tab;
  }

  return "vehicles";
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
