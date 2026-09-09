import { formatCurrency } from "@/lib/currency";
import type { RemittanceContributionTotals } from "@/features/payroll/types";
import { cn } from "@/lib/utils";

export function RemittanceSummaryStrip({
  employeeCount,
  periodCount,
  employeesMissingIdsCount,
  totals,
  className,
}: {
  employeeCount: number;
  periodCount: number;
  employeesMissingIdsCount: number;
  totals: RemittanceContributionTotals;
  className?: string;
}) {
  const items = [
    {
      label: "Employees",
      value: String(employeeCount),
      tone: "neutral" as const,
    },
    {
      label: "Finalized periods",
      value: String(periodCount),
      tone: periodCount > 0 ? ("success" as const) : ("neutral" as const),
    },
    {
      label: "Missing IDs",
      value: String(employeesMissingIdsCount),
      tone: employeesMissingIdsCount > 0 ? ("warning" as const) : ("neutral" as const),
    },
    {
      label: "EE total",
      value: formatCurrency(totals.totalAmount),
      tone: "neutral" as const,
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {item.label}
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums text-foreground",
              item.tone === "warning" && "text-warning",
              item.tone === "success" && "text-success",
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
