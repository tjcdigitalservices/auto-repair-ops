import type { PayrollDashboardSummary } from "@/features/payroll/types";
import { cn } from "@/lib/utils";

export function PayrollPeriodsSummaryStrip({
  summary,
  className,
}: {
  summary: PayrollDashboardSummary;
  className?: string;
}) {
  const items = [
    {
      label: "Periods",
      value: String(summary.payrollPeriodCount),
      tone: "neutral" as const,
    },
    {
      label: "Processing",
      value: String(summary.processingPeriodCount),
      tone: summary.processingPeriodCount > 0 ? ("warning" as const) : ("neutral" as const),
    },
    {
      label: "Draft",
      value: String(summary.draftPeriodCount),
      tone: "neutral" as const,
    },
    {
      label: "Finalized",
      value: String(summary.finalizedPeriodCount),
      tone: summary.finalizedPeriodCount > 0 ? ("success" as const) : ("neutral" as const),
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

export function CompensationSetupSummaryStrip({
  summary,
  className,
}: {
  summary: PayrollDashboardSummary;
  className?: string;
}) {
  const items = [
    {
      label: "Eligible staff",
      value: String(summary.eligibleStaffCount),
      tone: "neutral" as const,
    },
    {
      label: "Configured",
      value: String(summary.configuredStaffCount),
      tone: "success" as const,
    },
    {
      label: "Incomplete",
      value: String(summary.incompleteSetupCount),
      tone: summary.incompleteSetupCount > 0 ? ("warning" as const) : ("neutral" as const),
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
