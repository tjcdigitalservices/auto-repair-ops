import type { ProductImportType } from "@/features/products/import/product-import-constants";

export type ParsedProductImportRow = {
  rowNumber: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  brand: string | null;
  partNumber: string | null;
  oemNumber: string | null;
  unit: string;
  productType: ProductImportType;
  costPrice: number;
  sellingPrice: number;
  currentStock: number | null;
  reorderLevel: number;
  shelfLocation: string | null;
  supplier: string | null;
  description: string | null;
  status: "active" | "inactive";
};
