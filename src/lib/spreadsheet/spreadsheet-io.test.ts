import { describe, expect, it } from "vitest";

import { parseSpreadsheetNonNegativeNumber } from "@/lib/spreadsheet/spreadsheet-io";

describe("parseSpreadsheetNonNegativeNumber", () => {
  it("returns fallback for empty values", () => {
    expect(parseSpreadsheetNonNegativeNumber(null, 0)).toBe(0);
    expect(parseSpreadsheetNonNegativeNumber("", 0)).toBe(0);
    expect(parseSpreadsheetNonNegativeNumber("   ", 0)).toBe(0);
  });

  it("parses plain and currency-formatted values", () => {
    expect(parseSpreadsheetNonNegativeNumber(250)).toBe(250);
    expect(parseSpreadsheetNonNegativeNumber("1,250.50")).toBe(1250.5);
    expect(parseSpreadsheetNonNegativeNumber("₱1,250.00")).toBe(1250);
    expect(parseSpreadsheetNonNegativeNumber("PHP 99.5")).toBe(99.5);
    expect(parseSpreadsheetNonNegativeNumber("₱\u00a01,000")).toBe(1000);
    // SheetJS Latin-1 misread of UTF-8 peso sign
    expect(parseSpreadsheetNonNegativeNumber("â\u0082±2,200.0000")).toBe(2200);
  });

  it("rejects negatives and non-numeric text", () => {
    expect(parseSpreadsheetNonNegativeNumber(-1, 0)).toBeNull();
    expect(parseSpreadsheetNonNegativeNumber("(100)", 0)).toBeNull();
    expect(parseSpreadsheetNonNegativeNumber("N/A", 0)).toBeNull();
  });
});
