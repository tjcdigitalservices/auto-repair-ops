export const PRODUCT_IMPORT_MAX_ROWS = 1000;
export const PRODUCT_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMPORT_TEMPLATE_HEADERS = [
  "Product Name",
  "SKU",
  "Barcode",
  "Category",
  "Brand",
  "Part No.",
  "OEM No.",
  "Unit",
  "Product Type",
  "Cost Price",
  "Selling Price",
  "Current Stock",
  "Reorder Level",
  "Location",
  "Supplier",
  "Notes",
  "Status",
] as const;

export const PRODUCT_IMPORT_SAMPLE_ROW = [
  "Synthetic Oil Filter",
  "FIL-001",
  "4801234567890",
  "Filters",
  "Generic",
  "OF-321",
  "OEM-OF-321",
  "Piece",
  "part",
  "150",
  "250",
  "10",
  "5",
  "A1-B2",
  "Main Supplier",
  "Fits common passenger cars",
  "active",
] as const;

export const PRODUCT_TYPES = [
  "part",
  "fluid",
  "consumable",
  "accessory",
  "tool",
] as const;

export type ProductImportType = (typeof PRODUCT_TYPES)[number];

/** Friendly header aliases → canonical field. */
export const PRODUCT_IMPORT_HEADER_ALIASES: Record<string, string> = {
  "product name": "name",
  name: "name",
  product: "name",
  sku: "sku",
  "product id": "sku",
  barcode: "barcode",
  category: "category",
  brand: "brand",
  "part no.": "partNumber",
  "part no": "partNumber",
  "part number": "partNumber",
  part_number: "partNumber",
  "oem no.": "oemNumber",
  "oem no": "oemNumber",
  "oem number": "oemNumber",
  oem_number: "oemNumber",
  unit: "unit",
  "product type": "productType",
  type: "productType",
  product_type: "productType",
  "cost price": "costPrice",
  cost: "costPrice",
  cost_price: "costPrice",
  "selling price": "sellingPrice",
  price: "sellingPrice",
  selling_price: "sellingPrice",
  "current stock": "currentStock",
  stock: "currentStock",
  quantity: "currentStock",
  current_stock: "currentStock",
  "reorder level": "reorderLevel",
  reorder: "reorderLevel",
  reorder_level: "reorderLevel",
  location: "shelfLocation",
  "shelf location": "shelfLocation",
  shelf_location: "shelfLocation",
  supplier: "supplier",
  notes: "description",
  description: "description",
  status: "status",
};

export function buildProductImportTemplateCsv() {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replaceAll('"', '""')}"`;
    }
    return value;
  };

  return [
    PRODUCT_IMPORT_TEMPLATE_HEADERS.map(escape).join(","),
    PRODUCT_IMPORT_SAMPLE_ROW.map(escape).join(","),
  ].join("\n");
}
