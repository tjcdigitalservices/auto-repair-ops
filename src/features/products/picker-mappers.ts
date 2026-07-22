import type { TableRow } from "@/types/database";

import type { PosProductOption } from "@/features/pos/types";
import type { ProductInlineCreateResult, ProductPickerOption } from "@/features/products/types";

type ProductRow = Pick<
  TableRow<"products">,
  | "id"
  | "name"
  | "sku"
  | "barcode"
  | "oem_number"
  | "unit_id"
  | "selling_price"
  | "reorder_level"
  | "shelf_location"
>;

type StockRow = Pick<
  TableRow<"inventory_stocks">,
  "product_id" | "available_quantity" | "reorder_level" | "shelf_location"
>;

export function mapProductRowToPickerOption(
  row: ProductRow,
  params: {
    unitLabel: string | null;
    stock: StockRow | null;
  },
): ProductPickerOption {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    oemNumber: row.oem_number,
    unitLabel: params.unitLabel,
    unitPrice: row.selling_price,
    availableQuantity: params.stock?.available_quantity ?? 0,
    hasStockRecord: params.stock !== null,
  };
}

export function mapPosProductOptionToPickerOption(product: PosProductOption): ProductPickerOption {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    oemNumber: null,
    unitLabel: product.unitLabel,
    unitPrice: product.sellingPrice,
    availableQuantity: product.availableQuantity,
    hasStockRecord: product.hasStockRecord,
  };
}

export function mapInlineCreateResultToPickerOption(
  product: ProductInlineCreateResult,
): ProductPickerOption {
  return {
    id: product.id,
    name: product.label,
    sku: product.sku,
    barcode: product.barcode,
    oemNumber: null,
    unitLabel: product.unitLabel,
    unitPrice: product.unitPrice,
    availableQuantity: 0,
    hasStockRecord: false,
  };
}

export function filterProductPickerOptions(
  products: ProductPickerOption[],
  query: string,
  selectedProductId?: string,
) {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return products;
  }

  return products.filter((product) => {
    if (selectedProductId && product.id === selectedProductId) {
      return true;
    }

    return [product.name, product.sku, product.barcode, product.oemNumber]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}

export function formatProductPickerStockLabel(product: ProductPickerOption) {
  if (!product.hasStockRecord) {
    return "Stock: —";
  }

  return `Stock: ${product.availableQuantity}`;
}
