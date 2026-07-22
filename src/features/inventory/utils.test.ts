import { describe, expect, it } from "vitest";

import {
  buildInventorySummary,
  filterInventoryStocks,
  formatInventoryMovementType,
  formatInventoryQuantity,
  matchesInventoryStockState,
} from "@/features/inventory/utils";
import type { InventoryStockItem } from "@/features/inventory/types";

const inStockItem: InventoryStockItem = {
  stockId: "stock-1",
  productId: "product-1",
  productName: "Brake pads",
  sku: "BRK-001",
  barcode: "111",
  categoryName: "Brakes",
  productType: "part",
  unitLabel: "Set (set)",
  costPrice: 1200,
  sellingPrice: 1800,
  quantityOnHand: 10,
  reservedQuantity: 0,
  availableQuantity: 10,
  reorderLevel: 3,
  shelfLocation: "A-01",
  hasStockRecord: true,
  isInStock: true,
  isLowStock: false,
  isOutOfStock: false,
};

const lowStockItem: InventoryStockItem = {
  ...inStockItem,
  stockId: "stock-2",
  productId: "product-2",
  productName: "Air filter",
  sku: "FLT-001",
  quantityOnHand: 3,
  availableQuantity: 3,
  reorderLevel: 3,
  isInStock: false,
  isLowStock: true,
  isOutOfStock: false,
};

const outOfStockItem: InventoryStockItem = {
  ...inStockItem,
  stockId: "stock-3",
  productId: "product-3",
  productName: "Wiper blades",
  sku: "WPR-001",
  quantityOnHand: 0,
  availableQuantity: 0,
  isInStock: false,
  isLowStock: false,
  isOutOfStock: true,
};

const missingRecordItem: InventoryStockItem = {
  ...inStockItem,
  stockId: null,
  productId: "product-4",
  productName: "Engine oil",
  sku: "OIL-001",
  quantityOnHand: 0,
  availableQuantity: 0,
  reorderLevel: 2,
  shelfLocation: null,
  hasStockRecord: false,
  isInStock: false,
  isLowStock: false,
  isOutOfStock: false,
};

const stocks = [inStockItem, lowStockItem, outOfStockItem, missingRecordItem];

describe("inventory utils", () => {
  it("builds inventory summary totals by lifecycle state", () => {
    const summary = buildInventorySummary(stocks);

    expect(summary.allItemsCount).toBe(4);
    expect(summary.inStockCount).toBe(1);
    expect(summary.lowStockCount).toBe(1);
    expect(summary.outOfStockCount).toBe(1);
    expect(summary.totalOnHandQuantity).toBe(13);
    expect(summary.totalStockValue).toBe(15600);
  });

  it("matches inventory stock lifecycle states", () => {
    expect(matchesInventoryStockState(inStockItem, "in_stock")).toBe(true);
    expect(matchesInventoryStockState(lowStockItem, "low")).toBe(true);
    expect(matchesInventoryStockState(outOfStockItem, "out")).toBe(true);
    expect(matchesInventoryStockState(missingRecordItem, "missing")).toBe(true);
    expect(matchesInventoryStockState(missingRecordItem, "out")).toBe(false);
  });

  it("filters inventory stocks by state and search", () => {
    expect(filterInventoryStocks(stocks, { stockState: "in_stock" })).toHaveLength(1);
    expect(filterInventoryStocks(stocks, { stockState: "missing" })).toHaveLength(1);
    expect(filterInventoryStocks(stocks, { stockState: "out" })).toHaveLength(1);
    expect(filterInventoryStocks(stocks, { search: "brake" })).toHaveLength(1);
  });

  it("formats movement labels and quantities", () => {
    expect(formatInventoryMovementType("service_usage")).toBe("service usage");
    expect(formatInventoryQuantity(2)).toBe("2");
    expect(formatInventoryQuantity(2.5)).toBe("2.5");
  });
});
