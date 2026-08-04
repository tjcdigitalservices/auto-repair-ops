"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";

import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { Button } from "@/components/ui/button";
import { PayrollPeriodItemAdjustmentsDialog } from "@/features/payroll/components/payroll-period-item-adjustments-dialog";
import { fetchPayrollItemBreakdown } from "@/features/payroll/payroll-item-breakdown-api";
import {
  computePayrollEmployeeActionItems,
  resolvePrimaryEmployeeActionItem,
} from "@/features/payroll/payroll-validation";
import type { PayrollPeriodItemSummary } from "@/features/payroll/types";
import {
  formatPayrollWarningLabel,
  formatWorkedDuration,
  getPayrollAttendedDayCount,
} from "@/features/payroll/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export function PayrollReviewEmployeeExpanded({
  periodId,
  item,
}: {
  periodId: string;
  item: PayrollPeriodItemSummary;
}) {
  const query = useQuery({
    queryKey: ["payroll-review-expanded", periodId, item.id],
    queryFn: () => fetchPayrollItemBreakdown(periodId, item.id),
  });

  const secondaryIssues = useMemo(() => {
    const primary = resolvePrimaryEmployeeActionItem(item, periodId);
    return computePayrollEmployeeActionItems([item], periodId).filter(
      (issue) => issue.id !== primary?.id,
    );
  }, [item, periodId]);

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading employee details…
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        {query.error instanceof Error ? query.error.message : "Unable to load payroll details."}
      </p>
    );
  }

  const warningDetails = query.data?.warningDetails ?? [];
  const presentCount = getPayrollAttendedDayCount(item);

  return (
    <div className="space-y-4">
      <DetailSummaryGrid className="xl:grid-cols-2 2xl:grid-cols-3">
        <DetailSummaryItem
          label="Attendance summary"
          value={`Present ${presentCount} · Late ${item.lateCount} · Absent ${item.absentCount}`}
        />
        <DetailSummaryItem label="Worked hours" value={formatWorkedDuration(item.workedMinutes)} />
        <DetailSummaryItem label="Late" value={String(item.lateCount)} />
        <DetailSummaryItem label="Absent" value={String(item.absentCount)} />
        <DetailSummaryItem label="Overtime" value={formatCurrency(item.overtimePay)} />
        <DetailSummaryItem label="Salary rate" value={formatCurrency(item.dailyRateUsed)} />
        <DetailSummaryItem label="Gross pay" value={formatCurrency(item.grossPay)} />
        <DetailSummaryItem label="Allowances" value={formatCurrency(item.allowancePay)} />
        <DetailSummaryItem label="Adjustments" value={formatCurrency(item.manualAdditionsTotal)} />
        <DetailSummaryItem label="Holiday pay" value={formatCurrency(item.holidayPremiumPay)} />
        <DetailSummaryItem label="Net pay" value={formatCurrency(item.netPay)} />
      </DetailSummaryGrid>

      {secondaryIssues.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Additional issues
          </p>
          {secondaryIssues.map((issue) => (
            <div
              key={issue.id}
              className="rounded-xl border border-border/70 bg-background px-3 py-3 text-sm"
            >
              <p className="font-medium text-foreground">{issue.issueLabel}</p>
              <p className="text-muted-foreground">{issue.explanation}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Warnings
        </p>
        {warningDetails.length > 0 ? (
          warningDetails.map((warning) => (
            <div
              key={`${warning.date ?? "general"}-${warning.label}`}
              className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-3 text-sm text-amber-950"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">{warning.label}</p>
                  {warning.date ? <p>{formatDate(warning.date)}</p> : null}
                  <p className="text-amber-900/80">{warning.reason}</p>
                </div>
              </div>
            </div>
          ))
        ) : item.warningCodes.length > 0 ? (
          item.warningCodes.map((code) => (
            <div
              key={code}
              className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-3 text-sm text-amber-950"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p className="font-medium">{formatPayrollWarningLabel(code)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No warnings for this employee.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <PayrollPeriodItemAdjustmentsDialog item={item} triggerVariant="button" />
        <Button asChild variant="outline" size="sm">
          <Link href={`/payroll/${periodId}/payslip/${item.id}/print`} target="_blank">
            View payslip
          </Link>
        </Button>
      </div>
    </div>
  );
}
