import { PageHeader } from "@/components/shared/page-header";
import { PayrollPeriodDetailHeaderActions } from "@/features/payroll/components/payroll-period-detail-header-actions";
import { PayrollReviewWorkspace } from "@/features/payroll/components/payroll-review-workspace";
import type { PayrollPeriodDetailData } from "@/features/payroll/types";
import { formatPayrollCoverage } from "@/features/payroll/utils";

export function PayrollPeriodDetail({ data }: { data: PayrollPeriodDetailData }) {
  const { period, items, summary } = data;
  const hasGeneratedCut = Boolean(period.generatedAt && items.length > 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll Review"
        description={`${period.label} · Coverage ${formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}`}
        backHref="/payroll"
        backLabel="Back to payroll"
        actions={
          <PayrollPeriodDetailHeaderActions
            periodId={period.id}
            status={period.status}
            hasGeneratedCut={hasGeneratedCut}
            items={items}
            summary={summary}
          />
        }
      />

      <PayrollReviewWorkspace data={data} />
    </div>
  );
}
