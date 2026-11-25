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

  it("accepts peso-formatted cost and selling prices", () => {
    const buffer = workbookFromRows([
      ["Product Name", "Unit", "Cost Price", "Selling Price"],
      ["Brake Pad", "Piece", "₱150.00", "PHP 1,250.50"],
    ]);

    const parsed = parseProductImportWorkbook(buffer);

    expect(parsed.invalidRows).toEqual([]);
    expect(parsed.validRows[0]).toMatchObject({
      name: "Brake Pad",
      costPrice: 150,
      sellingPrice: 1250.5,
    });
  });

  it("parses UTF-8 CSV exports that include peso signs", () => {
    const csv = [
      "Product ID,Product Name,Unit,Cost Price,Selling Price,Current Stock",
      'PRD-0327,Brembo Brake Pads,Set,,"₱2,200.0000",2',
    ].join("\n");
    const buffer = new TextEncoder().encode(csv).buffer;

    const parsed = parseProductImportWorkbook(buffer);

    expect(parsed.invalidRows).toEqual([]);
    expect(parsed.validRows[0]).toMatchObject({
      name: "Brembo Brake Pads",
      sku: "PRD-0327",
      sellingPrice: 2200,
      currentStock: 2,
    });
  });

  it("builds a downloadable CSV template", () => {
    const csv = buildProductImportTemplateCsv();
    expect(csv).toContain("Product Name");
    expect(csv).toContain("Synthetic Oil Filter");
  });
});
