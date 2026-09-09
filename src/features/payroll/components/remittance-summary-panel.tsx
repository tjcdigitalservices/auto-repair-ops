import Link from "next/link";

import {
  DataTableCellStack,
  DataTablePrimaryText,
  DataTableSecondaryText,
} from "@/components/shared/data-table-cells";
import { BranchSelector } from "@/components/shared/branch-selector";
import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeaderActions } from "@/components/shared/page-header-actions";
import { PageTabToolbar } from "@/components/shared/page-tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RemittanceMonthFilter } from "@/features/payroll/components/remittance-month-filter";
import { RemittanceSummaryStrip } from "@/features/payroll/components/remittance-summary-strip";
import type { RemittanceSummaryData } from "@/features/payroll/types";
import { formatPayrollCoverage } from "@/features/payroll/utils";
import { formatCurrency } from "@/lib/currency";
import type { PageBranchSelectorProps } from "@/lib/branches";

function MissingValue() {
  return <span className="text-muted-foreground">—</span>;
}

function IdValue({ value }: { value: string | null }) {
  const trimmed = value?.trim();
  return trimmed ? <span className="tabular-nums">{trimmed}</span> : <MissingValue />;
}

export function RemittanceSummaryPanel({
  data,
  branchSelector,
}: {
  data: RemittanceSummaryData;
  branchSelector: PageBranchSelectorProps;
}) {
  const printHref = `/payroll/remittance/print?month=${encodeURIComponent(data.month)}`;

  return (
    <div className="space-y-3 pt-4">
      <RemittanceSummaryStrip
        employeeCount={data.employeeCount}
        periodCount={data.includedPeriods.length}
        employeesMissingIdsCount={data.employeesMissingIdsCount}
        totals={data.totals}
      />

      <DataTableCard
        contentClassName="p-0"
        toolbar={
          <PageTabToolbar>
            <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <BranchSelector {...branchSelector} className="w-full lg:w-[12rem]" />
                <RemittanceMonthFilter month={data.month} />
              </div>
              <PageHeaderActions
                primary={
                  <Button asChild variant="outline" size="sm">
                    <Link href={printHref}>Print summary</Link>
                  </Button>
                }
              />
            </div>
          </PageTabToolbar>
        }
      >
        {data.includedPeriods.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={`No finalized payroll for ${data.monthLabel}`}
              description="Finalize payroll periods that cover this month to build the employee remittance summary."
            />
          </div>
        ) : (
          <div className="space-y-6 p-5">
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Included finalized periods</h2>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {data.includedPeriods.map((period) => (
                  <li key={period.id}>
                    <Link
                      href={`/payroll/${period.id}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {period.label}
                    </Link>
                    <span>
                      {" "}
                      · {formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {data.employees.length === 0 ? (
              <EmptyState
                title="No employee government deductions"
                description="Finalized periods in this month have no SSS, PhilHealth, or Pag-IBIG system deductions yet."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>SSS No.</TableHead>
                      <TableHead>PhilHealth No.</TableHead>
                      <TableHead>Pag-IBIG No.</TableHead>
                      <TableHead className="text-right">SSS (EE)</TableHead>
                      <TableHead className="text-right">PhilHealth (EE)</TableHead>
                      <TableHead className="text-right">Pag-IBIG (EE)</TableHead>
                      <TableHead className="text-right">Total EE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.employees.map((employee) => (
                      <TableRow key={employee.staffId}>
                        <TableCell>
                          <DataTableCellStack>
                            <DataTablePrimaryText>{employee.fullName}</DataTablePrimaryText>
                            <DataTableSecondaryText className="capitalize">
                              {employee.role.replaceAll("_", " ")}
                              {employee.missingIdCount > 0
                                ? ` · ${employee.missingIdCount} missing ID${employee.missingIdCount === 1 ? "" : "s"}`
                                : ""}
                            </DataTableSecondaryText>
                          </DataTableCellStack>
                        </TableCell>
                        <TableCell>
                          <IdValue value={employee.sssNumber} />
                        </TableCell>
                        <TableCell>
                          <IdValue value={employee.philhealthNumber} />
                        </TableCell>
                        <TableCell>
                          <IdValue value={employee.pagibigNumber} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(employee.sssAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(employee.philhealthAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(employee.pagibigAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(employee.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell colSpan={4}>Totals</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(data.totals.sssAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(data.totals.philhealthAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(data.totals.pagibigAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(data.totals.totalAmount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
