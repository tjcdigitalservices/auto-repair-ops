import { describe, expect, it } from "vitest";

import { buildPosCategoryFilters, matchesPosCategoryFilter } from "@/features/pos/constants";
import {
  decrementCartItem,
  findPosProductByScanValue,
  incrementCartItem,
} from "@/features/pos/utils";

const product = {
  id: "product-1",
  name: "Engine oil",
  sku: "OIL-001",
  barcode: "123456",
  imageUrl: null,
  unitLabel: "Bottle (btl)",
  categoryId: null,
  categoryName: "Lubricants",
  sellingPrice: 550,
  availableQuantity: 3,
  hasStockRecord: true,
  reorderLevel: 2,
  shelfLocation: "A-02",
  isLowStock: false,
} as const;

describe("pos constants", () => {
  it("builds category filters with quick presets first", () => {
    expect(
      buildPosCategoryFilters(["Lubricants", "Brakes", "Custom Parts", "Brakes"]),
    ).toEqual(["All", "Brakes", "Lubricants", "Custom Parts"]);
  });

  it("matches category filters case-insensitively", () => {
    expect(matchesPosCategoryFilter("lubricants", "Lubricants")).toBe(true);
    expect(matchesPosCategoryFilter("Engine", "Brakes")).toBe(false);
    expect(matchesPosCategoryFilter(null, "All")).toBe(true);
  });
});

describe("pos scan helpers", () => {
  it("finds products by barcode or sku", () => {
    expect(findPosProductByScanValue([product], "123456")?.id).toBe("product-1");
    expect(findPosProductByScanValue([product], "OIL-001")?.id).toBe("product-1");
    expect(findPosProductByScanValue([product], "missing")).toBeNull();
  });

  it("increments and decrements cart quantities inline", () => {
    const cart = [{ ...product, productId: product.id, unitPrice: product.sellingPrice, quantity: 2 }];
    const increased = incrementCartItem(cart, product.id);
    const decreased = decrementCartItem(increased, product.id);

    expect(increased[0]?.quantity).toBe(3);
    expect(decreased[0]?.quantity).toBe(2);
  });
});
