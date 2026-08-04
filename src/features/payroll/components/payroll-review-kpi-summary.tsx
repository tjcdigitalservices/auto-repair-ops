"use client";

import { CalendarDays, Clock, Sparkles, Wallet, Banknote } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import type {
  PayrollPeriodDetailSummary,
  PayrollPeriodSummary,
  PayrollSettingsSummary,
} from "@/features/payroll/types";
import { formatPayrollPayoutDate, formatWorkedDuration } from "@/features/payroll/utils";
import { formatCurrency } from "@/lib/currency";

export function PayrollReviewKpiSummary({
  summary,
  period,
  settings,
  hasGeneratedCut,
}: {
  summary: PayrollPeriodDetailSummary;
  period: PayrollPeriodSummary;
  settings: PayrollSettingsSummary;
  hasGeneratedCut: boolean;
}) {
  if (!hasGeneratedCut) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Generate the payroll cut to start reviewing employee payouts for this period.
      </div>
    );
  }

  const holidayAndOvertimeTotal = summary.totalHolidayPremiumPay + summary.totalOvertimePay;
  const holidayPremiumPercent = Math.round(settings.holidayPremiumRate * 10000) / 100;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Net Payout"
        value={formatCurrency(summary.totalNetPay)}
        description="Current payout after manual additions and deductions"
        icon={Wallet}
      />
      <StatCard
        title="Base Pay"
        value={formatCurrency(summary.totalBasePay)}
        description="Computed from paid day units before late deductions"
        icon={Banknote}
      />
      <StatCard
        title="Holiday + Overtime"
        value={formatCurrency(holidayAndOvertimeTotal)}
        description={`Holiday premium ${holidayPremiumPercent}% · ${settings.standardDailyHours}h standard day`}
        icon={Sparkles}
      />
      <StatCard
        title="Total Hours Worked"
        value={formatWorkedDuration(summary.totalWorkedMinutes)}
        description="Captured attendance hours in this payroll coverage"
        icon={Clock}
      />
      <StatCard
        title="Expected Payout Date"
        value={formatPayrollPayoutDate(period.payoutDate)}
        description={period.label}
        icon={CalendarDays}
      />
    </div>
  );
}
