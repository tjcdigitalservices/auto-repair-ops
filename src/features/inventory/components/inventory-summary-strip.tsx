"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageMetric, PageMetrics } from "@/components/shared/page-metrics";
import type { InventoryMetricStockState } from "@/features/inventory/constants";
import type { InventoryStockFilterState, InventorySummary } from "@/features/inventory/types";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

function formatCompactInventoryValue(value: number) {
  if (Math.abs(value) >= 10_000) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }

  return formatCurrency(value);
}

export function InventorySummaryStrip({
  summary,
  stockState,
  className,
}: {
  summary: InventorySummary;
  stockState: InventoryStockFilterState;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const applyStockFilter = useCallback(
    (nextStockState: InventoryMetricStockState) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextStockState === "all") {
        params.delete("stockState");
      } else {
        params.set("stockState", nextStockState);
      }

      params.delete("stockPage");

      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <PageMetrics className={cn(className)} aria-label="Inventory summary">
      <PageMetric
        label="All Items"
        value={summary.allItemsCount}
        variant="secondary"
        active={stockState === "all"}
        onClick={() => applyStockFilter("all")}
      />
      <PageMetric
        label="In Stock"
        value={summary.inStockCount}
        variant="secondary"
        active={stockState === "in_stock"}
        onClick={() => applyStockFilter("in_stock")}
      />
      <PageMetric
        label="Low Stock"
        value={summary.lowStockCount}
        variant="warning"
        active={stockState === "low"}
        onClick={() => applyStockFilter("low")}
      />
      <PageMetric
        label="Out of Stock"
        value={summary.outOfStockCount}
        variant="destructive"
        active={stockState === "out"}
        onClick={() => applyStockFilter("out")}
      />
      <PageMetric
        label="Inventory Value"
        value={formatCompactInventoryValue(summary.totalStockValue)}
        variant="outline"
      />
    </PageMetrics>
  );
}
