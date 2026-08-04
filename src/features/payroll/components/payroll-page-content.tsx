import Link from "next/link";

import {
  DataTableCellStack,
  DataTablePrimaryText,
  DataTableSecondaryText,
} from "@/components/shared/data-table-cells";
import { BranchSelector } from "@/components/shared/branch-selector";
import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination, DataTableRecordSummary } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions } from "@/components/shared/page-header-actions";
import { PageTabToolbar } from "@/components/shared/page-tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatScheduleSummary } from "@/features/attendance/utils";
import { PayrollPeriodDialog } from "@/features/payroll/components/payroll-period-dialog";
import { PayrollPeriodRowActions } from "@/features/payroll/components/payroll-period-row-actions";
import { PayrollPeriodStatusBadge } from "@/features/payroll/components/payroll-period-status-badge";
import { PayrollStaffRowActions } from "@/features/payroll/components/payroll-staff-row-actions";
import {
  CompensationSetupSummaryStrip,
  PayrollPeriodsSummaryStrip,
} from "@/features/payroll/components/payroll-summary-strip";
import { PayrollTabNav, type PayrollPageTab } from "@/features/payroll/components/payroll-tab-nav";
import type { PayrollPageData } from "@/features/payroll/types";
import {
  PAYROLL_PERIOD_STATUS_OPTIONS,
  PAYROLL_STAFF_SETUP_FILTER_OPTIONS,
  formatPayBasisLabel,
  formatPayrollCoverage,
  getCompensationSetupStatusLabel,
  getCompensationSetupStatusTone,
  isCompensationSetupComplete,
} from "@/features/payroll/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import type { PageBranchSelectorProps } from "@/lib/branches";
import { paginateItems } from "@/lib/pagination";

function MissingValue() {
  return <span className="text-muted-foreground">—</span>;
}

export function PayrollPageContent({
  data,
  activeTab,
  periodPage,
  staffPage,
  branchSelector,
}: {
  data: PayrollPageData;
  activeTab: PayrollPageTab;
  periodPage?: string;
  staffPage?: string;
  branchSelector: PageBranchSelectorProps;
}) {
  const {
    filters,
    summary,
    payrollPeriods,
    compensationRoster,
    excludedPayrollStaff,
    totalCompensationRosterCount,
  } = data;
  const periodPagination = paginateItems(payrollPeriods, periodPage);
  const compensationPagination = paginateItems(compensationRoster, staffPage);

  return (
    <div className="space-y-0">
      <PageHeader
        title="Payroll"
        description="Compensation setup and payroll period processing."
        actions={
          activeTab === "periods" ? (
            <PageHeaderActions primary={<PayrollPeriodDialog />} />
          ) : null
        }
      />

      <PayrollTabNav
        periodCount={summary.payrollPeriodCount}
        compensationCount={totalCompensationRosterCount}
      />

      {activeTab === "periods" ? (
        <div className="space-y-3 pt-4">
          <PayrollPeriodsSummaryStrip summary={summary} />

          <DataTableCard
            contentClassName="p-0"
            toolbar={
              <PageTabToolbar>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <BranchSelector {...branchSelector} className="w-full lg:w-[12rem]" />
                  <DataTableFilters
                key={`${filters.periodSearch}:${filters.periodStatus}`}
                className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
                pageParamName="periodPage"
                search={{
                  name: "periodSearch",
                  value: filters.periodSearch,
                  placeholder: "Search period label, notes, or date",
                }}
                filters={[
                  {
                    type: "select",
                    name: "periodStatus",
                    value: filters.periodStatus,
                    options: [
                      { value: "", label: "All period statuses" },
                      ...PAYROLL_PERIOD_STATUS_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ],
                  },
                ]}
              />
                </div>
              </PageTabToolbar>
            }
            footer={
              <DataTablePagination
                page={periodPagination.page}
                pageSize={periodPagination.pageSize}
                totalItems={periodPagination.totalItems}
                totalPages={periodPagination.totalPages}
                startItem={periodPagination.startItem}
                endItem={periodPagination.endItem}
                pageParamName="periodPage"
              />
            }
          >
            {periodPagination.totalItems === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No payroll periods yet"
                  description="Create a payroll period to start compensation review for a coverage window."
                  action={
                    <PayrollPeriodDialog
                      triggerLabel="+ New Payroll Period"
                      showIcon={false}
                    />
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Payout date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-14 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodPagination.items.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell>
                          <TableCellLink href={`/payroll/${period.id}`} className="font-medium text-foreground">
                            {period.label}
                          </TableCellLink>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <TableCellLink href={`/payroll/${period.id}`} className="text-foreground">
                            {formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}
                          </TableCellLink>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <TableCellLink href={`/payroll/${period.id}`} className="text-foreground">
                            {formatDate(period.payoutDate)}
                          </TableCellLink>
                        </TableCell>
                        <TableCell>
                          <TableCellLink href={`/payroll/${period.id}`}>
                            <PayrollPeriodStatusBadge status={period.status} />
                          </TableCellLink>
                        </TableCell>
                        <TableCell className="max-w-[240px] text-muted-foreground">
                          <TableCellLink href={`/payroll/${period.id}`} className="line-clamp-1 text-foreground">
                            {period.notes?.trim() ? period.notes : "—"}
                          </TableCellLink>
                        </TableCell>
                        <TableCell className="text-right">
                          <PayrollPeriodRowActions periodId={period.id} periodLabel={period.label} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DataTableCard>
        </div>
      ) : (
        <div className="space-y-3 pt-4">
          <CompensationSetupSummaryStrip summary={summary} />

          <DataTableCard
            contentClassName="p-0"
            toolbar={
              <PageTabToolbar>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <BranchSelector {...branchSelector} className="w-full lg:w-[12rem]" />
                  <DataTableFilters
                key={`${filters.staffSearch}:${filters.staffFilter}`}
                className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_240px]"
                pageParamName="staffPage"
                search={{
                  name: "staffSearch",
                  value: filters.staffSearch,
                  placeholder: "Search staff name, role, or contact number",
                }}
                filters={[
                  {
                    type: "select",
                    name: "staffFilter",
                    value: filters.staffFilter,
                    options: [
                      { value: "", label: "All payroll staff" },
                      ...PAYROLL_STAFF_SETUP_FILTER_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ],
                  },
                ]}
              />
                </div>
              </PageTabToolbar>
            }
            footer={
              <DataTablePagination
                page={compensationPagination.page}
                pageSize={compensationPagination.pageSize}
                totalItems={compensationPagination.totalItems}
                totalPages={compensationPagination.totalPages}
                startItem={compensationPagination.startItem}
                endItem={compensationPagination.endItem}
                pageParamName="staffPage"
              />
            }
          >
            {compensationPagination.totalItems === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No payroll staff match"
                  description="Adjust filters or configure compensation for eligible staff members."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Pay basis + base rate</TableHead>
                      <TableHead>Allowance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-14 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compensationPagination.items.map((item) => {
                      const setupComplete = isCompensationSetupComplete(item);

                      return (
                        <TableRow key={item.staffId}>
                          <TableCell>
                            <DataTableCellStack>
                              <DataTablePrimaryText>{item.fullName}</DataTablePrimaryText>
                              <DataTableSecondaryText className="capitalize">
                                {item.role.replaceAll("_", " ")}
                              </DataTableSecondaryText>
                            </DataTableCellStack>
                          </TableCell>
                          <TableCell className="max-w-[220px] text-muted-foreground">
                            {item.schedule ? (
                              <p className="line-clamp-2 text-sm">{formatScheduleSummary(item.schedule)}</p>
                            ) : (
                              <MissingValue />
                            )}
                          </TableCell>
                          <TableCell>
                            {item.profile ? (
                              <DataTableCellStack>
                                <DataTablePrimaryText>
                                  {formatPayBasisLabel(item.profile.payBasis)}
                                </DataTablePrimaryText>
                                <DataTableSecondaryText className="tabular-nums">
                                  {formatCurrency(item.profile.baseRate)}
                                </DataTableSecondaryText>
                              </DataTableCellStack>
                            ) : (
                              <MissingValue />
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {item.profile ? formatCurrency(item.profile.allowancePerPeriod) : <MissingValue />}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              tone={getCompensationSetupStatusTone(item)}
                              variant="table"
                            >
                              {getCompensationSetupStatusLabel(item)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-right">
                            {setupComplete ? (
                              <PayrollStaffRowActions
                                staffId={item.staffId}
                                staffName={item.fullName}
                                schedule={item.schedule}
                                profile={item.profile}
                                label={`Compensation actions for ${item.fullName}`}
                              />
                            ) : (
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/staff/${item.staffId}/edit`}>Complete setup</Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </DataTableCard>

          {excludedPayrollStaff.length > 0 ? (
            <DataTableCard
              contentClassName="p-0"
              footer={<DataTableRecordSummary totalItems={excludedPayrollStaff.length} />}
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-40 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excludedPayrollStaff.map((item) => (
                      <TableRow key={item.staffId}>
                        <TableCell>
                          <DataTablePrimaryText>{item.fullName}</DataTablePrimaryText>
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">
                          {item.role.replaceAll("_", " ")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/staff/${item.staffId}/edit`}>Include in payroll</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataTableCard>
          ) : null}
        </div>
      )}
    </div>
  );
}
