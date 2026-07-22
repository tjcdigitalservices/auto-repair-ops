import type { InventoryStockFilterState } from "@/features/inventory/types";

export const INVENTORY_STOCK_STATE_OPTIONS: Array<{
  value: InventoryStockFilterState;
  label: string;
}> = [
  { value: "all", label: "All Items" },
  { value: "in_stock", label: "In Stock" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
  { value: "missing", label: "Missing Stock Record" },
];

export const INVENTORY_METRIC_STOCK_STATES = [
  "all",
  "in_stock",
  "low",
  "out",
] as const satisfies readonly InventoryStockFilterState[];

export type InventoryMetricStockState = (typeof INVENTORY_METRIC_STOCK_STATES)[number];

export function isInventoryMetricStockState(
  value: InventoryStockFilterState,
): value is InventoryMetricStockState {
  return INVENTORY_METRIC_STOCK_STATES.includes(value as InventoryMetricStockState);
}
