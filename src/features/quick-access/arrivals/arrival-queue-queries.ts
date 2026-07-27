import { DateTime } from "luxon";

import type { AppCapability } from "@/lib/auth/permissions";
import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { mapCustomerDetail } from "@/features/customers/mappers";
import { mapQuotationRowToListItem, mapVehicleRowToQuotationOption } from "@/features/quotations/mappers";
import type { QuotationListItem } from "@/features/quotations/types";
import {
  ARRIVAL_QUEUE_STATUS_LABELS,
  resolveArrivalCardPrimaryLabel,
  resolveArrivalQueueStatus,
  type ArrivalQueueItem,
  type ArrivalSource,
} from "@/features/quick-access/arrivals/arrival-queue-types";
import { isMissingDailyArrivalsTable } from "@/features/quick-access/arrivals/arrival-queue-schema";
import type { QuickAccessPermissions } from "@/features/quick-access/types";
import {
  findLatestActiveQuotationForVehicle,
  resolveQuickAccessPrimaryActionWithIntakeContext,
  type QuickAccessLinkedJobOrder,
} from "@/features/quick-access/workflow";
import { mapVehicleDetail } from "@/features/vehicles/mappers";
import type { TableRow } from "@/types/database";

type DailyArrivalRow = TableRow<"daily_arrivals">;

type CustomerRow = TableRow<"customers">;
type VehicleRow = TableRow<"vehicles">;
type QuotationRow = TableRow<"quotations">;
type JobOrderRow = TableRow<"job_orders">;

function todayQueueDate() {
  return DateTime.local().toISODate() ?? new Date().toISOString().slice(0, 10);
}

export async function listTodayArrivalQueue(params?: {
  activeIntakeVehicleId?: string | null;
}): Promise<{
  items: ArrivalQueueItem[];
  permissions: QuickAccessPermissions;
  queueAvailable: boolean;
}> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("vehicles:read");
  const branchId = branchScope.selectedBranchId ?? branchScope.writeBranchId;
  const queueDate = todayQueueDate();

  const permissions: QuickAccessPermissions = {
    canCreateQuotations: context.capabilities.includes("quotations:write"),
    canCreateVehicle: context.capabilities.includes("vehicles:write"),
    canViewQuotations: context.capabilities.includes("quotations:read"),
    canViewJobOrders: context.capabilities.includes("job_orders:read"),
    canViewServiceHistory: context.capabilities.includes("job_orders:read"),
    canRecordPastService: context.capabilities.includes("job_orders:write"),
  };

  const { data: arrivalRows, error: arrivalError } = await applyBranchFilter(
    supabase
      .from("daily_arrivals")
      .select("*")
      .eq("queue_date", queueDate)
      .order("arrived_at", { ascending: true }),
    branchId,
  );

  if (arrivalError) {
    if (isMissingDailyArrivalsTable(arrivalError)) {
      return { items: [], permissions, queueAvailable: false };
    }

    throw new Error(arrivalError.message);
  }

  const arrivals = (arrivalRows ?? []) as DailyArrivalRow[];

  if (arrivals.length === 0) {
    return { items: [], permissions, queueAvailable: true };
  }

  const customerIds = [...new Set(arrivals.map((row) => row.customer_id))];
  const vehicleIds = arrivals.map((row) => row.vehicle_id);

  const [{ data: customerRows }, { data: vehicleRows }] = await Promise.all([
    applyBranchFilter(
      supabase.from("customers").select("*").in("id", customerIds),
      branchId,
    ),
    applyBranchFilter(supabase.from("vehicles").select("*").in("id", vehicleIds), branchId),
  ]);

  const customers = new Map(
    ((customerRows ?? []) as CustomerRow[]).map((row) => [row.id, row]),
  );
  const vehicles = new Map(((vehicleRows ?? []) as VehicleRow[]).map((row) => [row.id, row]));

  const quotationsByCustomerId = await listRecentQuotationsByCustomerId({
    supabase,
    branchId,
    customerRows: (customerRows ?? []) as CustomerRow[],
    vehicleRows: (vehicleRows ?? []) as VehicleRow[],
    canViewQuotations: permissions.canViewQuotations,
  });

  const linkedJobOrdersByQuotationId = await listLinkedJobOrdersByQuotationId({
    supabase,
    branchId,
    quotationsByCustomerId,
    canViewJobOrders: permissions.canViewJobOrders,
  });

  const activeIntakeVehicleId = params?.activeIntakeVehicleId ?? null;

  const items = arrivals.flatMap((arrival) => {
    const customerRow = customers.get(arrival.customer_id);
    const vehicleRow = vehicles.get(arrival.vehicle_id);

    if (!customerRow || !vehicleRow) {
      return [];
    }

    const customerVehicles = ((vehicleRows ?? []) as VehicleRow[]).filter(
      (row) => row.customer_id === customerRow.id,
    );
    const customer = mapCustomerDetail(customerRow, customerVehicles, []);
    const vehicle = mapVehicleDetail(vehicleRow, customer.displayName);
    const recentQuotations = quotationsByCustomerId.get(arrival.customer_id) ?? [];
    const jobOrdersByQuotationId = new Map<string, QuickAccessLinkedJobOrder>(
      Object.entries(
        pickLinkedJobOrdersForQuotations(linkedJobOrdersByQuotationId, recentQuotations),
      ),
    );

    const primaryAction = resolveQuickAccessPrimaryActionWithIntakeContext({
      customerId: arrival.customer_id,
      vehicleId: arrival.vehicle_id,
      recentQuotations,
      jobOrdersByQuotationId,
      permissions,
    });

    const latestQuotation = findLatestActiveQuotationForVehicle(
      recentQuotations,
      arrival.vehicle_id,
    );
    const linkedJobOrder = latestQuotation
      ? jobOrdersByQuotationId.get(latestQuotation.id) ?? null
      : null;

    const isCurrentIntake = activeIntakeVehicleId === arrival.vehicle_id;
    const queueStatus = resolveArrivalQueueStatus({
      workflowState: primaryAction.state,
      jobOrderStatus: linkedJobOrder?.status ?? null,
      isCurrentIntake,
      intakeStartedAt: arrival.intake_started_at,
    });

    const intakeActionLabel = resolveArrivalCardPrimaryLabel({
      queueStatus,
      primaryAction,
      isCurrentIntake,
    });

    return [
      {
        id: arrival.id,
        customerId: arrival.customer_id,
        vehicleId: arrival.vehicle_id,
        customerName: customer.displayName,
        vehicleLabel: `${vehicle.make} ${vehicle.model}`,
        plateNumber: vehicle.plateNumber ?? "",
        arrivedAt: arrival.arrived_at,
        intakeStartedAt: arrival.intake_started_at,
        lastActivityAt: arrival.last_activity_at,
        arrivalSource: arrival.arrival_source as ArrivalSource,
        queueStatus,
        queueStatusLabel: ARRIVAL_QUEUE_STATUS_LABELS[queueStatus],
        primaryAction,
        intakeActionLabel,
      } satisfies ArrivalQueueItem,
    ];
  });

  return { items, permissions, queueAvailable: true };
}

async function listRecentQuotationsByCustomerId(params: {
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"];
  branchId: string | null;
  customerRows: CustomerRow[];
  vehicleRows: VehicleRow[];
  canViewQuotations: boolean;
}) {
  if (!params.canViewQuotations || params.customerRows.length === 0) {
    return new Map<string, QuotationListItem[]>();
  }

  const customerIds = params.customerRows.map((row) => row.id);

  const { data, error } = await applyBranchFilter(
    params.supabase
      .from("quotations")
      .select("*")
      .in("customer_id", customerIds)
      .order("created_at", { ascending: false })
      .limit(120),
    params.branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  const customerNames = new Map(
    params.customerRows.map((row) => [row.id, row.display_name]),
  );
  const vehicleLabels = new Map(
    params.vehicleRows.map((vehicle) => [vehicle.id, mapVehicleRowToQuotationOption(vehicle).label]),
  );

  return ((data ?? []) as QuotationRow[]).reduce<Map<string, QuotationListItem[]>>(
    (groups, quotation) => {
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
    },
    new Map(),
  );
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

function pickLinkedJobOrdersForQuotations(
  linkedJobOrdersByQuotationId: Record<string, QuickAccessLinkedJobOrder>,
  recentQuotations: QuotationListItem[],
) {
  return recentQuotations.reduce<Record<string, QuickAccessLinkedJobOrder>>(
    (result, quotation) => {
      const linked = linkedJobOrdersByQuotationId[quotation.id];

      if (linked) {
        result[quotation.id] = linked;
      }

      return result;
    },
    {},
  );
}

export { findArrivalForVehicle } from "@/features/quick-access/arrivals/arrival-queue-utils";
