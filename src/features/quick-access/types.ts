import type { CustomerDetail } from "@/features/customers/types";
import type { QuotationListItem } from "@/features/quotations/types";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import type { VehicleDetail } from "@/features/vehicles/types";
import type { QuickAccessLinkedJobOrder } from "@/features/quick-access/workflow";

export type QuickAccessRecordMatch = {
  source: "plate" | "customer";
  label: string;
  plateMatchKind?: "exact" | "possible";
};

export type QuickAccessCustomerRecord = {
  id: string;
  customer: CustomerDetail;
  vehicles: VehicleDetail[];
  recentQuotations: QuotationListItem[];
  linkedJobOrdersByQuotationId: Record<string, QuickAccessLinkedJobOrder>;
  serviceHistory: ServiceHistoryEntry[];
  highlightedVehicleId: string | null;
  match: QuickAccessRecordMatch;
};

export type QuickAccessPermissions = {
  canCreateQuotations: boolean;
  canViewQuotations: boolean;
  canViewJobOrders: boolean;
  canViewServiceHistory: boolean;
  canRecordPastService: boolean;
};


export type QuickAccessSearchState = {
  plateQuery: string;
  customerLastNameQuery: string;
  records: QuickAccessCustomerRecord[];
  permissions: QuickAccessPermissions;
};
