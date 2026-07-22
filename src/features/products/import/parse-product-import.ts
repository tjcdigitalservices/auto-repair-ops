import * as XLSX from "xlsx";

import {
  PRODUCT_IMPORT_HEADER_ALIASES,
  PRODUCT_IMPORT_MAX_ROWS,
  PRODUCT_TYPES,
  type ProductImportType,
} from "@/features/products/import/product-import-constants";
import type { ParsedProductImportRow } from "@/features/products/import/product-import-types";

export type { ParsedProductImportRow };

export type ProductImportRowResult =
  | { ok: true; row: ParsedProductImportRow }
  | { ok: false; rowNumber: number; message: string };

export type ParsedProductImportFile = {
  sheetName: string;
  rows: ProductImportRowResult[];
  validRows: ParsedProductImportRow[];
  invalidRows: Array<{ rowNumber: number; message: string }>;
};

export function parseProductImportWorkbook(buffer: ArrayBuffer): ParsedProductImportFile {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName =
    workbook.SheetNames.find((name) => name.trim().toLowerCase() === "products") ??
    workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The file does not contain any worksheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });

  if (rawRows.length > PRODUCT_IMPORT_MAX_ROWS) {
    throw new Error(
      `Too many rows (${rawRows.length}). Import up to ${PRODUCT_IMPORT_MAX_ROWS} products at a time.`,
    );
  }

  const rows = rawRows.flatMap((rawRow, index) => mapRawRow(rawRow, index + 2));
  const validRows = rows.flatMap((row) => (row.ok ? [row.row] : []));
  const invalidRows = rows.flatMap((row) =>
    row.ok ? [] : [{ rowNumber: row.rowNumber, message: row.message }],
  );

  return { sheetName, rows, validRows, invalidRows };
}

function mapRawRow(
  rawRow: Record<string, unknown>,
  rowNumber: number,
): ProductImportRowResult[] {
  const mapped = mapHeaders(rawRow);

  if (isBlankMappedRow(mapped)) {
    return [];
  }

  const name = cleanText(mapped.name);
  if (!name) {
    return [{ ok: false, rowNumber, message: "Product Name is required." }];
  }

  const costPrice = parseNonNegativeNumber(mapped.costPrice, 0);
  if (costPrice === null) {
    return [{ ok: false, rowNumber, message: "Cost Price must be a non-negative number." }];
  }

  const sellingPrice = parseNonNegativeNumber(mapped.sellingPrice, 0);
  if (sellingPrice === null) {
    return [{ ok: false, rowNumber, message: "Selling Price must be a non-negative number." }];
  }

  const reorderLevel = parseNonNegativeNumber(mapped.reorderLevel, 0);
  if (reorderLevel === null) {
    return [{ ok: false, rowNumber, message: "Reorder Level must be a non-negative number." }];
  }

  let currentStock: number | null = null;
  if (mapped.currentStock !== undefined && mapped.currentStock !== null && mapped.currentStock !== "") {
    currentStock = parseNonNegativeNumber(mapped.currentStock, null);
    if (currentStock === null) {
      return [{ ok: false, rowNumber, message: "Current Stock must be a non-negative number." }];
    }
  }

  const productTypeRaw = (cleanText(mapped.productType) ?? "part").toLowerCase();
  if (!(PRODUCT_TYPES as readonly string[]).includes(productTypeRaw)) {
    return [
      {
        ok: false,
        rowNumber,
        message: `Product Type must be one of: ${PRODUCT_TYPES.join(", ")}.`,
      },
    ];
  }

  const statusRaw = (cleanText(mapped.status) ?? "active").toLowerCase();
  if (statusRaw !== "active" && statusRaw !== "inactive") {
    return [{ ok: false, rowNumber, message: 'Status must be "active" or "inactive".' }];
  }

  return [
    {
      ok: true,
      row: {
        rowNumber,
        name,
        sku: cleanText(mapped.sku),
        barcode: cleanText(mapped.barcode),
        category: cleanText(mapped.category),
        brand: cleanText(mapped.brand),
        partNumber: cleanText(mapped.partNumber),
        oemNumber: cleanText(mapped.oemNumber),
        unit: cleanText(mapped.unit) ?? "Piece",
        productType: productTypeRaw as ProductImportType,
        costPrice,
        sellingPrice,
        currentStock,
        reorderLevel,
        shelfLocation: cleanText(mapped.shelfLocation),
        supplier: cleanText(mapped.supplier),
        description: cleanText(mapped.description),
        status: statusRaw,
      },
    },
  ];
}

function mapHeaders(rawRow: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};

  for (const [header, value] of Object.entries(rawRow)) {
    const field = PRODUCT_IMPORT_HEADER_ALIASES[normalizeHeader(header)];
    if (!field) {
      continue;
    }
    mapped[field] = value;
  }

  return mapped;
}

function isBlankMappedRow(mapped: Record<string, unknown>) {
  return Object.values(mapped).every((value) => {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === "string") {
      return value.trim() === "";
    }
    return false;
  });
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text ? text : null;
}

function parseNonNegativeNumber(
  value: unknown,
  fallback: number | null,
): number | null {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  const text = String(value).trim().replace(/,/g, "");
  if (!text) {
    return fallback;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
