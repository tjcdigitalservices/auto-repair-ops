import { cache } from "react";

import {
  applyBranchFilter,
  getBranchScopedServerClient,
} from "@/lib/branches";
import {
  applyCatalogVisibilityFilter,
  getCatalogSharingSettings,
} from "@/lib/catalog-visibility";
import { listCustomerOptions } from "@/features/customers/queries/customer-queries";
import { getVehicleFormLookupData } from "@/features/vehicles/queries/vehicle-lookup-queries";
import {
  mapQuotationDetail,
  mapQuotationRowToListItem,
  mapServiceRowToQuotationOption,
  mapVehicleRowToQuotationOption,
} from "@/features/quotations/mappers";
import { mapProductRowToPickerOption } from "@/features/products/picker-mappers";
import { getProductFormOptions } from "@/features/products/queries/product-queries";
import { buildStockMap, buildUnitLabelMap } from "@/features/pos/mappers";
import type {
  QuotationCreateFlowOptions,
  QuotationDetail,
  QuotationFormOptions,
  QuotationListItem,
} from "@/features/quotations/types";
import { dedupeOptionsById } from "@/features/quotations/utils";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";

type QuotationRow = TableRow<"quotations">;
type QuotationItemRow = TableRow<"quotation_items">;
type CustomerRow = TableRow<"customers">;
type VehicleRow = TableRow<"vehicles">;
type ProductRow = TableRow<"products">;
type UnitRow = Pick<TableRow<"units">, "id" | "name" | "abbreviation">;
type StockRow = Pick<
  TableRow<"inventory_stocks">,
  "product_id" | "available_quantity" | "reorder_level" | "shelf_location"
>;
type ServiceRow = TableRow<"services">;
type JobOrderRow = TableRow<"job_orders">;

export async function listQuotations(filters?: {
  search?: string;
  status?: QuotationRow["status"] | "pending" | "";
}): Promise<QuotationListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("quotations:read");
  let query = applyBranchFilter(
    supabase
    .from("quotations")
    .select("*")
    .order("created_at", { ascending: false }),
    branchScope.selectedBranchId,
  );

  if (filters?.status === "pending") {
    query = query.in("status", ["draft", "pending_approval"]);
  } else if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchTerm(filters.search);
    query = query.ilike("quotation_number", `%${escapedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const quotations = (data ?? []) as QuotationRow[];
  const customerIds = [...new Set(quotations.map((row) => row.customer_id))];
  const vehicleIds = [...new Set(quotations.map((row) => row.vehicle_id))];
  const [customerMap, vehicleMap] = await Promise.all([
    getCustomerNameMap(customerIds),
    getVehicleLabelMap(vehicleIds),
  ]);

  return quotations.map((row) =>
    mapQuotationRowToListItem(
      row,
      customerMap.get(row.customer_id) ?? "Unknown customer",
      vehicleMap.get(row.vehicle_id) ?? "Unknown vehicle",
    ),
  );
}

export const getQuotationById = cache(async (quotationId: string): Promise<QuotationDetail | null> => {
  const { branchScope, supabase } = await getBranchScopedServerClient("quotations:read");

  const [
    { data: quotation, error: quotationError },
    { data: items, error: itemsError },
    { data: jobOrder, error: jobOrderError },
  ] = await Promise.all([
    applyBranchFilter(
      supabase.from("quotations").select("*"),
      branchScope.selectedBranchId,
    )
      .eq("id", quotationId)
      .maybeSingle(),
    supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("line_number", { ascending: true }),
    applyBranchFilter(
      supabase
      .from("job_orders")
      .select("id, job_order_number")
      .eq("quotation_id", quotationId),
      branchScope.selectedBranchId,
    ).maybeSingle(),
  ]);

  if (quotationError) {
    throw new Error(quotationError.message);
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (jobOrderError) {
    throw new Error(jobOrderError.message);
  }

  if (!quotation) {
    return null;
  }

  const [customerMap, vehicleMap] = await Promise.all([
    getCustomerNameMap([quotation.customer_id]),
    getVehicleLabelMap([quotation.vehicle_id]),
  ]);

  return mapQuotationDetail(
    quotation as QuotationRow,
    customerMap.get(quotation.customer_id) ?? "Unknown customer",
    vehicleMap.get(quotation.vehicle_id) ?? "Unknown vehicle",
    (items ?? []) as QuotationItemRow[],
    (jobOrder as Pick<JobOrderRow, "id" | "job_order_number"> | null) ?? null,
  );
});

export async function getQuotationFormOptions(): Promise<QuotationFormOptions> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("quotations:write");
  const sharingSettings = await getCatalogSharingSettings(supabase, branchScope.selectedBranchId);
  const canCreateProducts = context.capabilities.includes("products:write");
  const canCreateServices = context.capabilities.includes("services:write");
  const [
    customers,
    { data: vehicles, error: vehiclesError },
    { data: products, error: productsError },
    { data: services, error: servicesError },
    { data: units, error: unitsError },
    { data: stocks, error: stocksError },
    productFormOptions,
  ] = await Promise.all([
    listCustomerOptions(),
    applyBranchFilter(
      supabase
      .from("vehicles")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
      branchScope.selectedBranchId,
    ),
    applyCatalogVisibilityFilter(
      supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true }),
      {
        branchId: branchScope.selectedBranchId,
        includeGlobal: sharingSettings.allowGlobalProductCatalog,
      },
    ),
    applyCatalogVisibilityFilter(
      supabase
      .from("services")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true }),
      {
        branchId: branchScope.selectedBranchId,
        includeGlobal: sharingSettings.allowGlobalServiceCatalog,
      },
    ),
    supabase.from("units").select("id, name, abbreviation").order("name", { ascending: true }),
    branchScope.selectedBranchId
      ? supabase
          .from("inventory_stocks")
          .select("product_id, available_quantity, reorder_level, shelf_location")
          .eq("branch_id", branchScope.selectedBranchId)
      : Promise.resolve({ data: [], error: null }),
    canCreateProducts ? getProductFormOptions() : Promise.resolve(null),
  ]);

  if (vehiclesError) {
    throw new Error(vehiclesError.message);
  }

  if (productsError) {
    throw new Error(productsError.message);
  }

  if (servicesError) {
    throw new Error(servicesError.message);
  }

  if (unitsError) {
    throw new Error(unitsError.message);
  }

  if (stocksError) {
    throw new Error(stocksError.message);
  }

  const unitLabelMap = buildUnitLabelMap((units ?? []) as UnitRow[]);
  const stockMap = buildStockMap((stocks ?? []) as StockRow[]);

  return {
    customers: dedupeOptionsById(customers),
    vehicles: dedupeOptionsById(
      ((vehicles ?? []) as VehicleRow[]).map(mapVehicleRowToQuotationOption),
    ),
    products: dedupeOptionsById(
      ((products ?? []) as ProductRow[]).map((row) =>
        mapProductRowToPickerOption(row, {
          unitLabel: unitLabelMap.get(row.unit_id) ?? null,
          stock: stockMap.get(row.id) ?? null,
        }),
      ),
    ),
    services: dedupeOptionsById(
      ((services ?? []) as ServiceRow[]).map(mapServiceRowToQuotationOption),
    ),
    productFormOptions,
    permissions: {
      canCreateProducts,
      canCreateServices,
    },
  };
}

export async function getQuotationCreateFlowOptions(): Promise<QuotationCreateFlowOptions> {
  const [formOptions, vehicleLookups] = await Promise.all([
    getQuotationFormOptions(),
    getVehicleFormLookupData(),
  ]);

  return {
    ...formOptions,
    vehicleLookups,
  };
}

async function getCustomerNameMap(customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, display_name")
    .in("id", customerIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as Pick<CustomerRow, "id" | "display_name">[]).map((row) => [
      row.id,
      row.display_name,
    ]),
  );
}

async function getVehicleLabelMap(vehicleIds: string[]) {
  if (vehicleIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("vehicles").select("*").in("id", vehicleIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as VehicleRow[]).map((vehicle) => {
      const option = mapVehicleRowToQuotationOption(vehicle);
      return [option.id, option.label];
    }),
  );
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
