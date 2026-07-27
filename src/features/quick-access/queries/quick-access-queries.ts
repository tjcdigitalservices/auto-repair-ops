import { redirect } from "next/navigation";

import type { AppCapability } from "@/lib/auth/permissions";
import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { mapCustomerDetail } from "@/features/customers/mappers";
import { mapQuotationRowToListItem, mapVehicleRowToQuotationOption } from "@/features/quotations/mappers";
import type { QuotationListItem } from "@/features/quotations/types";
import { listServiceHistoryByVehicleIdsForContext } from "@/features/service-history/queries/service-history-queries";
import { groupServiceHistoryByVehicle } from "@/features/service-history/utils";
import type {
  QuickAccessCustomerRecord,
  QuickAccessRecordMatch,
  QuickAccessSearchState,
} from "@/features/quick-access/types";
import type { QuickAccessLinkedJobOrder } from "@/features/quick-access/workflow";
import {
  isPossiblePlateMatch,
  normalizeQuickAccessPlate,
  resolveQuickAccessQuery,
} from "@/features/quick-access/utils";
import { mapVehicleDetail } from "@/features/vehicles/mappers";
import type { TableRow } from "@/types/database";

type CustomerRow = TableRow<"customers">;
type VehicleRow = TableRow<"vehicles">;
type QuotationRow = TableRow<"quotations">;
type JobOrderRow = TableRow<"job_orders">;

export async function getQuickAccessSearchState({
  query,
  plate,
  lastName,
  customerId,
  vehicleId,
}: {
  query?: string;
  plate?: string;
  lastName?: string;
  customerId?: string;
  vehicleId?: string;
}): Promise<QuickAccessSearchState> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("vehicles:read");

  if (
    !context.capabilities.includes("vehicles:read") ||
    !context.capabilities.includes("customers:read")
  ) {
    redirect("/forbidden");
  }

  const permissions = {
    canCreateQuotations: context.capabilities.includes("quotations:write"),
    canCreateVehicle: context.capabilities.includes("vehicles:write"),
    canViewQuotations: context.capabilities.includes("quotations:read"),
    canViewJobOrders: context.capabilities.includes("job_orders:read"),
    canViewServiceHistory: context.capabilities.includes("job_orders:read"),
    canRecordPastService: context.capabilities.includes("job_orders:write"),
  };
  const directPlateQuery = plate?.trim() ?? "";
  const directCustomerLastNameQuery = directPlateQuery ? "" : lastName?.trim() ?? "";
  const resolvedSearchInput = query?.trim()
    ? resolveQuickAccessQuery(query)
    : {
        plateQuery: directPlateQuery,
        customerLastNameQuery: directCustomerLastNameQuery,
      };
  const plateQuery = resolvedSearchInput.plateQuery;
  const customerLastNameQuery = resolvedSearchInput.customerLastNameQuery;
  const intakeCustomerId = customerId?.trim() ?? "";
  const intakeVehicleId = vehicleId?.trim() ?? "";

  const records =
    intakeCustomerId && intakeVehicleId
      ? await searchQuickAccessByIntakeIds(
          supabase,
          context.capabilities,
          branchScope.selectedBranchId,
          intakeCustomerId,
          intakeVehicleId,
          permissions.canViewQuotations,
        )
      : plateQuery
        ? await searchQuickAccessByPlate(
            supabase,
            context.capabilities,
            branchScope.selectedBranchId,
            plateQuery,
            permissions.canViewQuotations,
          )
        : customerLastNameQuery
          ? await searchQuickAccessByCustomerLastName(
              supabase,
              context.capabilities,
              branchScope.selectedBranchId,
              customerLastNameQuery,
              permissions.canViewQuotations,
            )
          : [];

  let resolvedPlateQuery = plateQuery;

  if (!resolvedPlateQuery && records.length > 0 && intakeVehicleId) {
    const vehicle = records[0]?.vehicles.find((item) => item.id === intakeVehicleId);
    resolvedPlateQuery = normalizeQuickAccessPlate(vehicle?.plateNumber ?? "");
  }

  return {
    plateQuery: resolvedPlateQuery,
    customerLastNameQuery,
    records,
    permissions,
    intakeCustomerId: intakeCustomerId || null,
    intakeVehicleId: intakeVehicleId || null,
  };
}

async function searchQuickAccessByIntakeIds(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  capabilities: readonly AppCapability[],
  branchId: string | null,
  customerId: string,
  vehicleId: string,
  canViewQuotations: boolean,
) {
  const { data: vehicleRow, error: vehicleError } = await applyBranchFilter(
    supabase.from("vehicles").select("*").eq("id", vehicleId),
    branchId,
  ).maybeSingle();

  if (vehicleError) {
    throw new Error(vehicleError.message);
  }

  if (!vehicleRow || vehicleRow.customer_id !== customerId) {
    return [];
  }

  const { data: customerRow, error: customerError } = await applyBranchFilter(
    supabase.from("customers").select("*").eq("id", customerId),
    branchId,
  ).maybeSingle();

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (!customerRow) {
    return [];
  }

  const { data: relatedVehicles, error: relatedVehiclesError } = await applyBranchFilter(
    supabase.from("vehicles").select("*").eq("customer_id", customerId),
    branchId,
  );

  if (relatedVehiclesError) {
    throw new Error(relatedVehiclesError.message);
  }

  return buildQuickAccessRecords({
    supabase,
    capabilities,
    branchId,
    customerRows: [customerRow as CustomerRow],
    vehicleRows: (relatedVehicles ?? []) as VehicleRow[],
    matches: [
      {
        customerId,
        highlightedVehicleId: vehicleId,
        match: {
          source: "plate",
          label: "Active intake",
          plateMatchKind: "exact",
        },
      },
    ],
    canViewQuotations,
  });
}

async function searchQuickAccessByPlate(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  capabilities: readonly AppCapability[],
  branchId: string | null,
  plateQuery: string,
  canViewQuotations: boolean,
) {
  const normalizedQuery = normalizeQuickAccessPlate(plateQuery);

  if (!normalizedQuery) {
    return [];
  }

  const { data, error } = await applyBranchFilter(
    supabase
      .from("vehicles")
      .select("*")
      .not("plate_number", "is", null)
      .order("created_at", { ascending: false }),
    branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  const vehicles = (data ?? []) as VehicleRow[];
  const exactVehicleRows = vehicles.filter(
    (vehicle) => normalizeQuickAccessPlate(vehicle.plate_number ?? "") === normalizedQuery,
  );
  const matchedVehicleRows =
    exactVehicleRows.length > 0
      ? exactVehicleRows.map((vehicleRow) => ({
          vehicleRow,
          match: {
            source: "plate" as const,
            label: "Exact plate match",
            plateMatchKind: "exact" as const,
          },
        }))
      : vehicles
          .filter((vehicle) => isPossiblePlateMatch(vehicle.plate_number, normalizedQuery))
          .map((vehicleRow) => ({
            vehicleRow,
            match: {
              source: "plate" as const,
              label: "Possible plate match",
              plateMatchKind: "possible" as const,
            },
          }));

  if (matchedVehicleRows.length === 0) {
    return [];
  }

  const customerIds = [...new Set(matchedVehicleRows.map(({ vehicleRow }) => vehicleRow.customer_id))];
  const [{ data: customers, error: customerError }, { data: relatedVehicles, error: vehicleError }] =
    await Promise.all([
      applyBranchFilter(supabase.from("customers").select("*").in("id", customerIds), branchId),
      applyBranchFilter(
        supabase.from("vehicles").select("*").in("customer_id", customerIds).order("created_at", {
          ascending: false,
        }),
        branchId,
      ),
    ]);

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (vehicleError) {
    throw new Error(vehicleError.message);
  }

  return buildQuickAccessRecords({
    supabase,
    capabilities,
    branchId,
    customerRows: (customers ?? []) as CustomerRow[],
    vehicleRows: (relatedVehicles ?? []) as VehicleRow[],
    matches: matchedVehicleRows.map(({ vehicleRow, match }) => ({
      customerId: vehicleRow.customer_id,
      highlightedVehicleId: vehicleRow.id,
      match,
    })),
    canViewQuotations,
  });
}

async function searchQuickAccessByCustomerLastName(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  capabilities: readonly AppCapability[],
  branchId: string | null,
  lastNameQuery: string,
  canViewQuotations: boolean,
) {
  const escapedLastName = escapeSearchTerm(lastNameQuery);
  const { data: customers, error: customerError } = await applyBranchFilter(
    supabase
      .from("customers")
      .select("*")
      .or(`last_name.ilike.%${escapedLastName}%,display_name.ilike.%${escapedLastName}%`)
      .order("display_name", { ascending: true })
      .limit(12),
    branchId,
  );

  if (customerError) {
    throw new Error(customerError.message);
  }

  const customerRows = (customers ?? []) as CustomerRow[];

  if (customerRows.length === 0) {
    return [];
  }

  const customerIds = customerRows.map((customer) => customer.id);
  const { data: vehicles, error: vehicleError } = await applyBranchFilter(
    supabase
      .from("vehicles")
      .select("*")
      .in("customer_id", customerIds)
      .order("created_at", { ascending: false }),
    branchId,
  );

  if (vehicleError) {
    throw new Error(vehicleError.message);
  }

  return buildQuickAccessRecords({
    supabase,
    capabilities,
    branchId,
    customerRows,
    vehicleRows: (vehicles ?? []) as VehicleRow[],
    matches: customerRows.map((customer) => ({
      customerId: customer.id,
      highlightedVehicleId: null,
      match: {
        source: "customer" as const,
        label: "Customer lookup result",
      },
    })),
    canViewQuotations,
  });
}

async function buildQuickAccessRecords(params: {
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"];
  capabilities: readonly AppCapability[];
  branchId: string | null;
  customerRows: CustomerRow[];
  vehicleRows: VehicleRow[];
  matches: Array<{
    customerId: string;
    highlightedVehicleId: string | null;
    match: QuickAccessRecordMatch;
  }>;
  canViewQuotations: boolean;
}): Promise<QuickAccessCustomerRecord[]> {
  if (params.matches.length === 0) {
    return [];
  }

  const customerMap = new Map(params.customerRows.map((customer) => [customer.id, customer]));
  const vehiclesByCustomerId = groupVehiclesByCustomerId(params.vehicleRows);
  const quotationsByCustomerId = await listRecentQuotationsByCustomerId({
    supabase: params.supabase,
    customerRows: params.customerRows,
    vehicleRows: params.vehicleRows,
    branchId: params.branchId,
    canViewQuotations: params.canViewQuotations,
  });
  const linkedJobOrdersByQuotationId = await listLinkedJobOrdersByQuotationId({
    supabase: params.supabase,
    branchId: params.branchId,
    quotationsByCustomerId,
    canViewJobOrders: params.capabilities.includes("job_orders:read"),
  });
  const serviceHistoryEntries = await listServiceHistoryByVehicleIdsForContext({
    supabase: params.supabase,
    capabilities: params.capabilities,
    vehicleIds: params.vehicleRows.map((vehicle) => vehicle.id),
    branchId: params.branchId,
  });
  const serviceHistoryByVehicleId = groupServiceHistoryByVehicle(serviceHistoryEntries);

  return params.matches.flatMap((match) => {
    const customerRow = customerMap.get(match.customerId);

    if (!customerRow) {
      return [];
    }

    const relatedVehicleRows = vehiclesByCustomerId.get(match.customerId) ?? [];
    const customer = mapCustomerDetail(customerRow, relatedVehicleRows, []);
    const vehicles = relatedVehicleRows.map((vehicleRow) =>
      mapVehicleDetail(vehicleRow, customer.displayName),
    );
    const recentQuotations = sortQuotationsForMatch(
      quotationsByCustomerId.get(match.customerId) ?? [],
      match.highlightedVehicleId,
    ).slice(0, 6);
    const serviceHistory = relatedVehicleRows.flatMap(
      (vehicleRow) => serviceHistoryByVehicleId.get(vehicleRow.id) ?? [],
    );

    return [
      {
        id: `${customer.id}:${match.highlightedVehicleId ?? match.match.source}`,
        customer,
        vehicles,
        recentQuotations,
        linkedJobOrdersByQuotationId: pickLinkedJobOrdersForCustomer(
          linkedJobOrdersByQuotationId,
          recentQuotations,
        ),
        serviceHistory,
        highlightedVehicleId: match.highlightedVehicleId,
        match: match.match,
      },
    ];
  });
}

async function listRecentQuotationsByCustomerId(params: {
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"];
  customerRows: CustomerRow[];
  vehicleRows: VehicleRow[];
  branchId: string | null;
  canViewQuotations: boolean;
}) {
  if (!params.canViewQuotations || params.customerRows.length === 0) {
    return new Map<string, QuotationListItem[]>();
  }

  const customerIds = params.customerRows.map((customer) => customer.id);
  const { data, error } = await applyBranchFilter(
    params.supabase
      .from("quotations")
      .select("*")
      .in("customer_id", customerIds)
      .order("created_at", { ascending: false })
      .limit(60),
    params.branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  const customerNames = new Map(params.customerRows.map((customer) => [customer.id, customer.display_name]));
  const vehicleLabels = new Map(
    params.vehicleRows.map((vehicle) => [vehicle.id, mapVehicleRowToQuotationOption(vehicle).label]),
  );

  return ((data ?? []) as QuotationRow[]).reduce<Map<string, QuotationListItem[]>>((groups, quotation) => {
    const existing = groups.get(quotation.customer_id) ?? [];
    groups.set(quotation.customer_id, [
      ...existing,
      mapQuotationRowToListItem(
        quotation,
        customerNames.get(quotation.customer_id) ?? "Unknown customer",
        vehicleLabels.get(quotation.vehicle_id) ?? "Unknown vehicle",
      ),
    ]);
    return groups;
  }, new Map());
}

async function listLinkedJobOrdersByQuotationId(params: {
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"];
  branchId: string | null;
  quotationsByCustomerId: Map<string, QuotationListItem[]>;
  canViewJobOrders: boolean;
}) {
  if (!params.canViewJobOrders) {
    return {} as Record<string, QuickAccessLinkedJobOrder>;
  }

  const quotationIds = [...params.quotationsByCustomerId.values()]
    .flat()
    .filter((quotation) => quotation.status === "approved")
    .map((quotation) => quotation.id);

  if (quotationIds.length === 0) {
    return {};
  }

  const { data, error } = await applyBranchFilter(
    params.supabase
      .from("job_orders")
      .select("id, quotation_id, vehicle_id, status")
      .in("quotation_id", quotationIds),
    params.branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  const jobOrderRows = (data ?? []) as Pick<
    JobOrderRow,
    "id" | "quotation_id" | "vehicle_id" | "status"
  >[];

  if (jobOrderRows.length === 0) {
    return {};
  }

  const jobOrderIds = jobOrderRows.map((row) => row.id);
  const { data: invoiceRows, error: invoiceError } = await applyBranchFilter(
    params.supabase.from("invoices").select("id, job_order_id").in("job_order_id", jobOrderIds),
    params.branchId,
  );

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  const invoiceIdByJobOrderId = new Map(
    ((invoiceRows ?? []) as Pick<TableRow<"invoices">, "id" | "job_order_id">[]).map((row) => [
      row.job_order_id,
      row.id,
    ]),
  );

  return jobOrderRows.reduce<Record<string, QuickAccessLinkedJobOrder>>((result, row) => {
    if (!row.quotation_id) {
      return result;
    }

    result[row.quotation_id] = {
      id: row.id,
      quotationId: row.quotation_id,
      vehicleId: row.vehicle_id,
      status: row.status,
      invoiceId: invoiceIdByJobOrderId.get(row.id) ?? null,
    };
    return result;
  }, {});
}

function pickLinkedJobOrdersForCustomer(
  linkedJobOrdersByQuotationId: Record<string, QuickAccessLinkedJobOrder>,
  recentQuotations: QuotationListItem[],
) {
  return recentQuotations.reduce<Record<string, QuickAccessLinkedJobOrder>>(
    (result, quotation) => {
      const linkedJobOrder = linkedJobOrdersByQuotationId[quotation.id];

      if (linkedJobOrder) {
        result[quotation.id] = linkedJobOrder;
      }

      return result;
    },
    {},
  );
}

function sortQuotationsForMatch(
  quotations: QuotationListItem[],
  highlightedVehicleId: string | null,
) {
  return [...quotations].sort((left, right) => {
    const leftMatch = highlightedVehicleId && left.vehicleId === highlightedVehicleId ? 1 : 0;
    const rightMatch = highlightedVehicleId && right.vehicleId === highlightedVehicleId ? 1 : 0;

    if (leftMatch !== rightMatch) {
      return rightMatch - leftMatch;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function groupVehiclesByCustomerId(vehicles: VehicleRow[]) {
  return vehicles.reduce<Map<string, VehicleRow[]>>((groups, vehicle) => {
    const existing = groups.get(vehicle.customer_id) ?? [];
    groups.set(vehicle.customer_id, [...existing, vehicle]);
    return groups;
  }, new Map());
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
