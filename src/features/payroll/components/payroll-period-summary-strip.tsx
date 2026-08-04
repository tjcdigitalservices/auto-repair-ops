import type { PayrollPeriodDetailSummary } from "@/features/payroll/types";
import { formatWorkedDuration } from "@/features/payroll/utils";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function PayrollPeriodSummaryStrip({
  summary,
  hasGeneratedCut,
  className,
}: {
  summary: PayrollPeriodDetailSummary;
  hasGeneratedCut: boolean;
  className?: string;
}) {
  if (!hasGeneratedCut) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        Generate the payroll cut to calculate period totals for this coverage window.
      </div>
    );
  }

  const items = [
    {
      label: "Staff",
      value: String(summary.totalStaffCount),
      tone: "neutral" as const,
    },
    {
      label: "Net pay",
      value: formatCurrency(summary.totalNetPay),
      tone: "neutral" as const,
    },
    {
      label: "Base pay",
      value: formatCurrency(summary.totalBasePay),
      tone: "neutral" as const,
    },
    {
      label: "Late deductions",
      value: formatCurrency(summary.totalLateDeductions),
      tone: summary.totalLateDeductions > 0 ? ("warning" as const) : ("neutral" as const),
    },
    {
      label: "Premium & OT",
      value: formatCurrency(summary.totalHolidayPremiumPay + summary.totalOvertimePay),
      tone: "neutral" as const,
    },
    {
      label: "Warnings",
      value: String(summary.warningStaffCount),
      tone: summary.warningStaffCount > 0 ? ("warning" as const) : ("success" as const),
    },
    {
      label: "Worked time",
      value: formatWorkedDuration(summary.totalWorkedMinutes),
      tone: "neutral" as const,
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm",
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
