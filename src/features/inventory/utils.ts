import type {
  InventoryMovementType,
  InventoryStockFilterState,
  InventoryStockItem,
  InventorySummary,
} from "@/features/inventory/types";
import { roundCurrency } from "@/lib/currency";

export function formatInventoryMovementType(type: InventoryMovementType) {
  return type.replaceAll("_", " ");
}

export function formatInventoryQuantity(value: number) {
  return value.toFixed(4).replace(/\.?0+$/, "");
}

export function matchesInventoryStockState(
  stock: InventoryStockItem,
  stockState: InventoryStockFilterState,
) {
  switch (stockState) {
    case "all":
      return true;
    case "in_stock":
      return stock.isInStock;
    case "low":
      return stock.isLowStock;
    case "out":
      return stock.isOutOfStock;
    case "missing":
      return !stock.hasStockRecord;
    default:
      return true;
  }
}

export function buildInventorySummary(stocks: InventoryStockItem[]): InventorySummary {
  return {
    allItemsCount: stocks.length,
    inStockCount: stocks.filter((stock) => stock.isInStock).length,
    lowStockCount: stocks.filter((stock) => stock.isLowStock).length,
    outOfStockCount: stocks.filter((stock) => stock.isOutOfStock).length,
    totalOnHandQuantity: roundQuantity(
      stocks.reduce((sum, stock) => sum + stock.quantityOnHand, 0),
    ),
    totalStockValue: roundCurrency(
      stocks.reduce((sum, stock) => sum + stock.quantityOnHand * stock.costPrice, 0),
    ),
  };
}

export function filterInventoryStocks(
  stocks: InventoryStockItem[],
  filters: {
    search?: string;
    stockState?: InventoryStockFilterState;
  },
) {
  const stockState = filters.stockState ?? "all";
  const loweredSearch = filters.search?.trim().toLowerCase() ?? "";

  return stocks.filter((stock) => {
    if (!matchesInventoryStockState(stock, stockState)) {
      return false;
    }

    if (!loweredSearch) {
      return true;
    }

    return [stock.productName, stock.sku ?? "", stock.barcode ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(loweredSearch);
  });
}

function roundQuantity(value: number) {
  return Number(value.toFixed(4));
}
