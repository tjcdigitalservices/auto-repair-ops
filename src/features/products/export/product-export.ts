import {
  applyCatalogVisibilityFilter,
  getCatalogSharingSettings,
} from "@/lib/catalog-visibility";
import { getBranchScopedServerClient } from "@/lib/branches";
import {
  buildBrandMap,
  buildCategoryMap,
  buildSupplierMap,
  buildUnitMap,
} from "@/features/products/mappers";
import type { TableRow } from "@/types/database";

type ProductRow = TableRow<"products">;
type CategoryRow = TableRow<"product_categories">;
type BrandRow = TableRow<"brands">;
type UnitRow = TableRow<"units">;
type SupplierRow = TableRow<"suppliers">;
type StockRow = Pick<
  TableRow<"inventory_stocks">,
  "product_id" | "available_quantity" | "shelf_location"
>;

export async function listProductSpreadsheetRows() {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("products:read");
  const branchId = branchScope.selectedBranchId ?? branchScope.writeBranchId;
  const sharingSettings = await getCatalogSharingSettings(supabase, branchId);
  const { data: products, error: productError } = await applyCatalogVisibilityFilter(
    supabase.from("products").select("*").order("name", { ascending: true }),
    {
      branchId,
      includeGlobal: sharingSettings.allowGlobalProductCatalog,
    },
  );

  if (productError) {
    throw new Error(productError.message);
  }

  const productRows = (products ?? []) as ProductRow[];
  const productIds = productRows.map((row) => row.id);

  const [
    categoriesResult,
    brandsResult,
    unitsResult,
    suppliersResult,
    stocksResult,
  ] = await Promise.all([
    supabase
      .from("product_categories")
      .select("*")
      .eq("tenant_id", context.tenantId)
      .order("name", { ascending: true }),
    supabase.from("brands").select("*").eq("tenant_id", context.tenantId).order("name", {
      ascending: true,
    }),
    supabase.from("units").select("*").eq("tenant_id", context.tenantId).order("name", {
      ascending: true,
    }),
    supabase
      .from("suppliers")
      .select("*")
      .eq("tenant_id", context.tenantId)
      .order("supplier_name", { ascending: true }),
    productIds.length
      ? supabase
          .from("inventory_stocks")
          .select("product_id, available_quantity, shelf_location")
          .eq("branch_id", branchId)
          .in("product_id", productIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [
    categoriesResult,
    brandsResult,
    unitsResult,
    suppliersResult,
    stocksResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const categories = buildCategoryMap((categoriesResult.data ?? []) as CategoryRow[]);
  const brands = buildBrandMap((brandsResult.data ?? []) as BrandRow[]);
  const units = buildUnitMap((unitsResult.data ?? []) as UnitRow[]);
  const suppliers = buildSupplierMap((suppliersResult.data ?? []) as SupplierRow[]);
  const stockByProductId = new Map(
    ((stocksResult.data ?? []) as StockRow[]).map((row) => [row.product_id, row]),
  );

  return productRows.map((row) => {
    const stock = stockByProductId.get(row.id);

    return {
      "Product Name": row.name,
      SKU: row.sku ?? "",
      Barcode: row.barcode ?? "",
      Category: row.category_id ? categories.get(row.category_id) ?? "" : "",
      Brand: row.brand_id ? brands.get(row.brand_id) ?? "" : "",
      "Part No.": row.part_number ?? "",
      "OEM No.": row.oem_number ?? "",
      Unit: row.unit_id ? units.get(row.unit_id) ?? "" : "",
      "Product Type": row.product_type,
      "Cost Price": row.cost_price,
      "Selling Price": row.selling_price,
      "Current Stock": stock?.available_quantity ?? 0,
      "Reorder Level": row.reorder_level,
      Location: stock?.shelf_location ?? "",
      Supplier: row.primary_supplier_id
        ? suppliers.get(row.primary_supplier_id) ?? ""
        : "",
      Notes: row.description ?? "",
      Status: row.status,
    };
  });
}
