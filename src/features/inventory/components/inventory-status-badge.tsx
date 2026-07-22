import { StatusBadge } from "@/components/shared/status-badge";
import type { InventoryMovementType, InventoryStockItem } from "@/features/inventory/types";
import { formatInventoryMovementType } from "@/features/inventory/utils";

export function InventoryStockStatusBadge({ stock }: { stock: InventoryStockItem }) {
  if (!stock.hasStockRecord) {
    return (
      <StatusBadge tone="neutral" variant="table">
        Missing record
      </StatusBadge>
    );
  }

  if (stock.isOutOfStock) {
    return (
      <StatusBadge tone="destructive" variant="table">
        Out of stock
      </StatusBadge>
    );
  }

  if (stock.isLowStock) {
    return (
      <StatusBadge tone="warning" variant="table">
        Low stock
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone="success" variant="table">
      In stock
    </StatusBadge>
  );
}

export function InventoryMovementTypeBadge({ type }: { type: InventoryMovementType }) {
  const tone =
    type === "stock_in"
      ? "success"
      : type === "damaged"
        ? "destructive"
        : type === "adjustment"
          ? "warning"
          : type === "return"
            ? "info"
            : "neutral";

  return (
    <StatusBadge tone={tone} variant="table">
      {formatInventoryMovementType(type)}
    </StatusBadge>
  );
}
