import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import type { BookingListItem, BookingServiceKind, BookingStatus } from "@/features/bookings/types";
import {
  SCHEDULED_BOOKINGS_MIGRATION_HINT,
  isMissingScheduledBookingsTable,
} from "@/features/bookings/booking-schema";
import type { TableRow } from "@/types/database";

type BookingRow = TableRow<"scheduled_bookings">;
type CustomerRow = Pick<TableRow<"customers">, "id" | "first_name" | "last_name">;
type VehicleRow = Pick<TableRow<"vehicles">, "id" | "plate_number" | "year" | "make" | "model">;

export async function listBookings(filters: {
  search?: string;
  status?: BookingStatus | "";
  rangeStart?: string;
  rangeEnd?: string;
}): Promise<{ bookings: BookingListItem[]; migrationHint?: string }> {
  const { branchScope, supabase } = await getBranchScopedServerClient("bookings:read");

  let query = supabase
    .from("scheduled_bookings")
    .select("*")
    .order("scheduled_start", { ascending: true });

  query = applyBranchFilter(query, branchScope.selectedBranchId);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.rangeStart) {
    query = query.gte("scheduled_start", `${filters.rangeStart}T00:00:00.000Z`);
  }

  if (filters.rangeEnd) {
    query = query.lte("scheduled_start", `${filters.rangeEnd}T23:59:59.999Z`);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingScheduledBookingsTable(error)) {
      return { bookings: [], migrationHint: SCHEDULED_BOOKINGS_MIGRATION_HINT };
    }

    throw new Error(error.message);
  }

  const rows = (data ?? []) as BookingRow[];

  if (rows.length === 0) {
    return { bookings: [] };
  }

  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const vehicleIds = [...new Set(rows.map((row) => row.vehicle_id))];

  const [{ data: customerRows, error: customerError }, { data: vehicleRows, error: vehicleError }] =
    await Promise.all([
      supabase.from("customers").select("id, first_name, last_name").in("id", customerIds),
      supabase.from("vehicles").select("id, plate_number, year, make, model").in("id", vehicleIds),
    ]);

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (vehicleError) {
    throw new Error(vehicleError.message);
  }

  const customers = new Map(
    ((customerRows ?? []) as CustomerRow[]).map((row) => [row.id, row] as const),
  );
  const vehicles = new Map(
    ((vehicleRows ?? []) as VehicleRow[]).map((row) => [row.id, row] as const),
  );

  const bookings = rows
    .map((row) => mapBookingListItem(row, customers.get(row.customer_id), vehicles.get(row.vehicle_id)))
    .filter((item): item is BookingListItem => Boolean(item))
    .filter((item) => matchesBookingSearch(item, filters.search));

  return { bookings };
}

function mapBookingListItem(
  row: BookingRow,
  customer: CustomerRow | undefined,
  vehicle: VehicleRow | undefined,
): BookingListItem | null {
  if (!customer || !vehicle) {
    return null;
  }

  return {
    id: row.id,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    serviceKind: row.service_kind as BookingServiceKind,
    customerConcern: row.customer_concern,
    status: row.status as BookingStatus,
    customerId: row.customer_id,
    customerName: `${customer.first_name} ${customer.last_name}`.trim(),
    vehicleId: row.vehicle_id,
    vehicleLabel: formatVehicleLabel(vehicle),
    createdBy: row.created_by as BookingListItem["createdBy"],
  };
}

function formatVehicleLabel(vehicle: VehicleRow) {
  const make = vehicle.make?.trim();
  const model = vehicle.model?.trim();
  const name = [vehicle.year, make, model].filter(Boolean).join(" ");
  const plate = vehicle.plate_number?.trim();

  if (name && plate) {
    return `${name} · ${plate}`;
  }

  return name || plate || "Vehicle";
}

function matchesBookingSearch(item: BookingListItem, search?: string) {
  const needle = search?.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  return (
    item.customerName.toLowerCase().includes(needle) ||
    item.vehicleLabel.toLowerCase().includes(needle) ||
    item.customerConcern.toLowerCase().includes(needle)
  );
}
