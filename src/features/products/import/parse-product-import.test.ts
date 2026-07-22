import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { parseProductImportWorkbook } from "@/features/products/import/parse-product-import";
import {
  PRODUCT_IMPORT_SAMPLE_ROW,
  PRODUCT_IMPORT_TEMPLATE_HEADERS,
  buildProductImportTemplateCsv,
} from "@/features/products/import/product-import-constants";

function workbookFromRows(rows: unknown[][]) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Products");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("parseProductImportWorkbook", () => {
  it("parses a valid spreadsheet row", () => {
    const buffer = workbookFromRows([
      [...PRODUCT_IMPORT_TEMPLATE_HEADERS],
      [...PRODUCT_IMPORT_SAMPLE_ROW],
    ]);

    const parsed = parseProductImportWorkbook(buffer);

    expect(parsed.validRows).toHaveLength(1);
    expect(parsed.invalidRows).toHaveLength(0);
    expect(parsed.validRows[0]).toMatchObject({
      name: "Synthetic Oil Filter",
      sku: "FIL-001",
      unit: "Piece",
      productType: "part",
      costPrice: 150,
      sellingPrice: 250,
      currentStock: 10,
      status: "active",
    });
  });

  it("rejects rows without a product name", () => {
    const buffer = workbookFromRows([
      ["Product Name", "Unit", "Cost Price", "Selling Price"],
      ["", "Piece", "10", "20"],
    ]);

    const parsed = parseProductImportWorkbook(buffer);

    expect(parsed.validRows).toHaveLength(0);
    expect(parsed.invalidRows[0]?.message).toMatch(/Product Name/i);
  });

  it("builds a downloadable CSV template", () => {
    const csv = buildProductImportTemplateCsv();
    expect(csv).toContain("Product Name");
    expect(csv).toContain("Synthetic Oil Filter");
  });
});
