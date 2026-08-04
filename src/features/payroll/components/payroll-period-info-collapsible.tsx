"use client";

import { ChevronDown } from "lucide-react";

import type { PayrollPeriodSummary, PayrollSettingsSummary } from "@/features/payroll/types";
import { formatPayrollCoverage } from "@/features/payroll/utils";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function PayrollPeriodInfoCollapsible({
  period,
  settings,
}: {
  period: PayrollPeriodSummary;
  settings: PayrollSettingsSummary;
}) {
  return (
    <details className="group rounded-xl border border-border/70 bg-background">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span>Payroll Information</span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2 border-t border-border/60 px-4 py-3 text-sm text-muted-foreground">
        <p>
          Coverage dates {formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}
        </p>
        <p>
          Payroll formula uses {settings.standardDailyHours} standard hours per day and a{" "}
          {Math.round(settings.holidayPremiumRate * 10000) / 100}% holiday premium on worked
          holiday dates.
        </p>
        {period.generatedAt ? <p>Generated {formatDateTime(period.generatedAt)}</p> : null}
        <p>Created {formatDateTime(period.createdAt)}</p>
        {period.notes?.trim() ? <p>Calculation notes {period.notes.trim()}</p> : null}
      </div>
    </details>
  );
}
