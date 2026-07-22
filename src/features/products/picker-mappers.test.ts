import { describe, expect, it } from "vitest";

import {
  filterProductPickerOptions,
  mapInlineCreateResultToPickerOption,
} from "@/features/products/picker-mappers";
import type { ProductPickerOption } from "@/features/products/types";

const sampleProducts: ProductPickerOption[] = [
  {
    id: "1",
    name: "Brake Pads - Brembo",
    sku: "BRK-001",
    barcode: "1234567890",
    oemNumber: "OEM-99",
    unitLabel: "Set",
    unitPrice: 2450,
    availableQuantity: 12,
    hasStockRecord: true,
  },
  {
    id: "2",
    name: "Engine Oil 5W-30",
    sku: "OIL-200",
    barcode: null,
    oemNumber: null,
    unitLabel: "Liter",
    unitPrice: 450,
    availableQuantity: 0,
    hasStockRecord: true,
  },
];

describe("filterProductPickerOptions", () => {
  it("filters by name, sku, barcode, and oem number", () => {
    expect(filterProductPickerOptions(sampleProducts, "brembo")).toHaveLength(1);
    expect(filterProductPickerOptions(sampleProducts, "BRK-001")).toHaveLength(1);
    expect(filterProductPickerOptions(sampleProducts, "1234567890")).toHaveLength(1);
    expect(filterProductPickerOptions(sampleProducts, "OEM-99")).toHaveLength(1);
  });

  it("keeps the selected product visible while filtering", () => {
    expect(filterProductPickerOptions(sampleProducts, "zzz", "2")).toHaveLength(1);
  });
});

describe("mapInlineCreateResultToPickerOption", () => {
  it("maps inline create results into picker options", () => {
    expect(
      mapInlineCreateResultToPickerOption({
        id: "new-1",
        label: "Custom Filter",
        sku: "FLT-1",
        barcode: null,
        productType: "part",
        unitLabel: "Piece",
        unitPrice: 120,
        costPrice: 80,
        reorderLevel: 0,
        shelfLocation: null,
        productImageUrl: null,
      }),
    ).toMatchObject({
      id: "new-1",
      name: "Custom Filter",
      unitPrice: 120,
      availableQuantity: 0,
      hasStockRecord: false,
    });
  });
});
