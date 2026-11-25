"use server";

import { revalidatePath } from "next/cache";

import { getBranchScopedServerClient } from "@/lib/branches";
import {
  PRODUCT_IMPORT_MAX_FILE_BYTES,
} from "@/features/products/import/product-import-constants";
import {
  INITIAL_PRODUCT_IMPORT_ACTION_STATE,
  type ProductImportActionState,
} from "@/features/products/import/product-import-action-state";
import type { ParsedProductImportRow } from "@/features/products/import/product-import-types";
import type { ProductType } from "@/features/products/types";

type NamedRef = {
  byName: Map<string, string>;
};

export async function importProductsFromFileAction(
  _prevState: ProductImportActionState = INITIAL_PRODUCT_IMPORT_ACTION_STATE,
  formData: FormData,
): Promise<ProductImportActionState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      message: "Choose a .csv or .xlsx file to import.",
    };
  }

  if (file.size > PRODUCT_IMPORT_MAX_FILE_BYTES) {
    return {
      status: "error",
      message: "Import files must be 5 MB or smaller.",
    };
  }

  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
    return {
      status: "error",
      message: "Only .csv, .xlsx, or .xls files are supported.",
    };
  }

  let parsed;
  try {
    const { parseProductImportWorkbook } = await import(
      "@/features/products/import/parse-product-import"
    );
    const buffer = await file.arrayBuffer();
    parsed = parseProductImportWorkbook(buffer);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to read the spreadsheet.",
    };
  }

  if (parsed.validRows.length === 0) {
    return {
      status: "error",
      message:
        parsed.invalidRows[0]?.message ??
        "No valid product rows found. Download the template and try again.",
      skippedInvalid: parsed.invalidRows.length,
      errorSamples: parsed.invalidRows.slice(0, 8),
    };
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient(
    "products:write",
  );
  const branchId = branchScope.writeBranchId;
  const tenantId = context.tenantId;

  const [
    categoriesResult,
    brandsResult,
    unitsResult,
    suppliersResult,
    productsResult,
  ] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, name")
      .eq("tenant_id", tenantId),
    supabase.from("brands").select("id, name").eq("tenant_id", tenantId),
    supabase
      .from("units")
      .select("id, name, abbreviation")
      .eq("tenant_id", tenantId),
    supabase
      .from("suppliers")
      .select("id, supplier_name")
      .eq("tenant_id", tenantId),
    supabase.from("products").select("id, sku, barcode").eq("branch_id", branchId),
  ]);

  for (const result of [
    categoriesResult,
    brandsResult,
    unitsResult,
    suppliersResult,
    productsResult,
  ]) {
    if (result.error) {
      return { status: "error", message: result.error.message };
    }
  }

  const categories: NamedRef = {
    byName: new Map(
      (categoriesResult.data ?? []).map((row) => [normalizeKey(row.name), row.id]),
    ),
  };
  const brands: NamedRef = {
    byName: new Map(
      (brandsResult.data ?? []).map((row) => [normalizeKey(row.name), row.id]),
    ),
  };
  const units: NamedRef = {
    byName: new Map(
      (unitsResult.data ?? []).flatMap((row) => {
        const entries: Array<[string, string]> = [
          [normalizeKey(row.name), row.id],
        ];
        if (row.abbreviation) {
          entries.push([normalizeKey(row.abbreviation), row.id]);
        }
        return entries;
      }),
    ),
  };
  const suppliers: NamedRef = {
    byName: new Map(
      (suppliersResult.data ?? []).map((row) => [
        normalizeKey(row.supplier_name),
        row.id,
      ]),
    ),
  };

  const productsBySku = new Map(
    (productsResult.data ?? [])
      .filter((row) => row.sku)
      .map((row) => [normalizeKey(row.sku!), row.id]),
  );
  const productsByBarcode = new Map(
    (productsResult.data ?? [])
      .filter((row) => row.barcode)
      .map((row) => [normalizeKey(row.barcode!), row.id]),
  );

  let created = 0;
  let updated = 0;
  let stocksUpserted = 0;
  const runtimeErrors: Array<{ rowNumber: number; message: string }> = [
    ...parsed.invalidRows,
  ];

  for (const row of parsed.validRows) {
    try {
      const unitId = await ensureUnit(supabase, units, row.unit, tenantId);

      const categoryId = row.category
        ? await ensureCategory(supabase, categories, row.category, tenantId)
        : null;

      const brandId = row.brand
        ? await ensureBrand(supabase, brands, row.brand, tenantId)
        : null;

      const supplierId = row.supplier
        ? await ensureSupplier(supabase, suppliers, row.supplier, tenantId)
        : null;

      const sku = normalizeNullableUpper(row.sku);
      const barcode = normalizeNullableUpper(row.barcode);
      const existingId =
        (sku ? productsBySku.get(normalizeKey(sku)) : undefined) ??
        (barcode ? productsByBarcode.get(normalizeKey(barcode)) : undefined);

      const payload = {
        branch_id: branchId,
        is_global: false,
        name: row.name,
        sku,
        barcode,
        category_id: categoryId,
        brand_id: brandId,
        primary_supplier_id: supplierId,
        unit_id: unitId,
        part_number: row.partNumber,
        oem_number: row.oemNumber,
        description: row.description,
        product_type: row.productType as ProductType,
        cost_price: row.costPrice,
        selling_price: row.sellingPrice,
        reorder_level: row.reorderLevel,
        shelf_location: row.shelfLocation,
        status: row.status,
        website_visible: false,
        website_featured: false,
        website_sort_order: 0,
      };

      let productId = existingId ?? crypto.randomUUID();

      if (existingId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", existingId)
          .eq("branch_id", branchId);

        if (error) {
          throw new Error(error.message);
        }
        updated += 1;
        productId = existingId;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({ id: productId, ...payload })
          .select("id")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        productId = data.id;
        created += 1;

        if (sku) {
          productsBySku.set(normalizeKey(sku), productId);
        }
        if (barcode) {
          productsByBarcode.set(normalizeKey(barcode), productId);
        }
      }

      if (row.currentStock !== null || row.reorderLevel > 0 || row.shelfLocation) {
        const stockChanged = await upsertStockRow({
          supabase,
          branchId,
          productId,
          createdByUserId: context.userId,
          row,
        });
        if (stockChanged) {
          stocksUpserted += 1;
        }
      }
    } catch (error) {
      runtimeErrors.push({
        rowNumber: row.rowNumber,
        message: error instanceof Error ? error.message : "Failed to save this product.",
      });
    }
  }

  revalidatePath("/products");
  revalidatePath("/inventory");

  const skippedInvalid = runtimeErrors.length;
  const messageParts = [
    `Imported ${created} new and updated ${updated} existing product${created + updated === 1 ? "" : "s"}.`,
  ];
  if (stocksUpserted > 0) {
    messageParts.push(`Synced stock for ${stocksUpserted} product${stocksUpserted === 1 ? "" : "s"}.`);
  }
  if (skippedInvalid > 0) {
    messageParts.push(`${skippedInvalid} row${skippedInvalid === 1 ? "" : "s"} skipped.`);
  }

  return {
    status: created + updated > 0 ? "success" : "error",
    message: messageParts.join(" "),
    created,
    updated,
    stocksUpserted,
    skippedInvalid,
    errorSamples: runtimeErrors.slice(0, 8),
  };
}

type ImportSupabase = Awaited<
  ReturnType<typeof getBranchScopedServerClient>
>["supabase"];

async function ensureUnit(
  supabase: ImportSupabase,
  ref: NamedRef,
  name: string,
  tenantId: string,
) {
  const key = normalizeKey(name);
  const existing = ref.byName.get(key);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("units")
    .insert({
      tenant_id: tenantId,
      name,
      abbreviation: buildUnitAbbreviation(name),
    })
    .select("id")
    .single();

  if (error) {
    const retry = await findLookupByName(supabase, "units", "name", tenantId, name);
    if (!retry) {
      throw new Error(error.message);
    }
    ref.byName.set(key, retry);
    return retry;
  }

  ref.byName.set(key, data.id);
  return data.id;
}

async function ensureCategory(
  supabase: ImportSupabase,
  ref: NamedRef,
  name: string,
  tenantId: string,
) {
  const key = normalizeKey(name);
  const existing = ref.byName.get(key);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("product_categories")
    .insert({ tenant_id: tenantId, name, status: "active" })
    .select("id")
    .single();

  if (error) {
    const retry = await findLookupByName(
      supabase,
      "product_categories",
      "name",
      tenantId,
      name,
    );
    if (!retry) {
      throw new Error(error.message);
    }
    ref.byName.set(key, retry);
    return retry;
  }

  ref.byName.set(key, data.id);
  return data.id;
}

async function ensureBrand(
  supabase: ImportSupabase,
  ref: NamedRef,
  name: string,
  tenantId: string,
) {
  const key = normalizeKey(name);
  const existing = ref.byName.get(key);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("brands")
    .insert({ tenant_id: tenantId, name, status: "active" })
    .select("id")
    .single();

  if (error) {
    const retry = await findLookupByName(supabase, "brands", "name", tenantId, name);
    if (!retry) {
      throw new Error(error.message);
    }
    ref.byName.set(key, retry);
    return retry;
  }

  ref.byName.set(key, data.id);
  return data.id;
}

async function ensureSupplier(
  supabase: ImportSupabase,
  ref: NamedRef,
  name: string,
  tenantId: string,
) {
  const key = normalizeKey(name);
  const existing = ref.byName.get(key);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({ tenant_id: tenantId, supplier_name: name, status: "active" })
    .select("id")
    .single();

  if (error) {
    const retry = await findLookupByName(
      supabase,
      "suppliers",
      "supplier_name",
      tenantId,
      name,
    );
    if (!retry) {
      throw new Error(error.message);
    }
    ref.byName.set(key, retry);
    return retry;
  }

  ref.byName.set(key, data.id);
  return data.id;
}

async function findLookupByName(
  supabase: ImportSupabase,
  table: "units" | "product_categories" | "brands" | "suppliers",
  nameColumn: "name" | "supplier_name",
  tenantId: string,
  name: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike(nameColumn, name)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id;
}

async function upsertStockRow(params: {
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"];
  branchId: string;
  productId: string;
  createdByUserId: string;
  row: ParsedProductImportRow;
}) {
  const wantsQuantity = params.row.currentStock !== null;
  const wantsSettings = params.row.reorderLevel > 0 || Boolean(params.row.shelfLocation?.trim());

  if (!wantsQuantity && !wantsSettings) {
    return false;
  }

  let changed = false;

  // inventory_stocks has no direct INSERT/UPDATE RLS — use security-definer RPCs.
  if (wantsQuantity && (params.row.currentStock ?? 0) > 0) {
    const { error } = await params.supabase.rpc("reconcile_inventory_stock", {
      p_branch_id: params.branchId,
      p_product_id: params.productId,
      p_counted_quantity: params.row.currentStock!,
      p_notes: "Product import",
      p_created_by: params.createdByUserId,
    });

    if (error && !isMatchingStockError(error.message)) {
      throw new Error(error.message);
    }

    changed = true;
  }

  if (wantsSettings || (wantsQuantity && (params.row.currentStock ?? 0) === 0)) {
    const { error } = await params.supabase.rpc("update_inventory_stock_settings", {
      p_branch_id: params.branchId,
      p_product_id: params.productId,
      p_reorder_level: params.row.reorderLevel > 0 ? params.row.reorderLevel : null,
      p_shelf_location: params.row.shelfLocation,
    });

    if (error) {
      throw new Error(error.message);
    }

    changed = true;
  }

  return changed;
}

function isMatchingStockError(message: string) {
  return /already matches the current stock/i.test(message);
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeNullableUpper(value: string | null) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function buildUnitAbbreviation(name: string) {
  const normalizedName = normalizeKey(name);
  const known: Record<string, string> = {
    bottle: "btl",
    gallon: "gal",
    liter: "L",
    pair: "pair",
    piece: "pc",
    set: "set",
  };

  return known[normalizedName] ?? normalizedName.slice(0, 8);
}
