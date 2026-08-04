"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { AppLink } from "@/components/shared/app-link";
import { DataTableRecordSummary } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { GeneratePayrollCutButton } from "@/features/payroll/components/generate-payroll-cut-button";
import { PayrollPeriodInfoCollapsible } from "@/features/payroll/components/payroll-period-info-collapsible";
import { PayrollPeriodItemBreakdownDrawer } from "@/features/payroll/components/payroll-period-item-breakdown-drawer";
import { PayrollReviewKpiSummary } from "@/features/payroll/components/payroll-review-kpi-summary";
import { resolvePrimaryEmployeeActionItem } from "@/features/payroll/payroll-validation";
import type {
  PayrollEmployeeActionItem,
  PayrollPeriodDetailData,
  PayrollPeriodItemSummary,
  PayrollPeriodStatus,
  PayrollReviewIssueFilter,
  PayrollReviewStatusFilter,
} from "@/features/payroll/types";
import {
  filterPayrollReviewItems,
  formatPayrollRoleLabel,
  isPayrollReviewIssueFilter,
  isPayrollReviewStatusFilter,
} from "@/features/payroll/utils";
import type { StaffRole } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

const REVIEW_SEARCH_PARAM = "q";
const REVIEW_STATUS_PARAM = "status";
const REVIEW_ISSUE_PARAM = "issue";
const REVIEW_ROLE_PARAM = "role";

const STATUS_FILTERS: Array<{ value: PayrollReviewStatusFilter; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "ready", label: "Ready" },
  { value: "needs_review", label: "Needs Review" },
];

const ISSUE_FILTERS: Array<{ value: PayrollReviewIssueFilter | ""; label: string }> = [
  { value: "", label: "All issues" },
  { value: "blocking_issues", label: "Blocking Issues" },
  { value: "warnings", label: "Warnings" },
  { value: "missing_dtr", label: "Missing DTR" },
  { value: "missing_salary_rate", label: "Missing Salary Rate" },
  { value: "manual_adjustments", label: "Manual Adjustments" },
  { value: "holiday_pay", label: "Holiday Pay" },
  { value: "overtime", label: "Overtime" },
];

const ROLE_OPTIONS: Array<{ value: StaffRole | ""; label: string }> = [
  { value: "", label: "All roles" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Administrator" },
  { value: "mechanic", label: "Mechanic" },
  { value: "cashier", label: "Cashier" },
  { value: "inventory_staff", label: "Inventory Staff" },
  { value: "service_advisor", label: "Service Advisor" },
];

export function PayrollReviewWorkspace({ data }: { data: PayrollPeriodDetailData }) {
  const { period, settings, summary, items } = data;
  const hasGeneratedCut = Boolean(period.generatedAt && items.length > 0);
  const generateFormId = `payroll-generate-cut-${period.id}`;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [breakdownItem, setBreakdownItem] = useState<PayrollPeriodItemSummary | null>(null);

  const search = searchParams.get(REVIEW_SEARCH_PARAM) ?? "";
  const rawStatusFilter = searchParams.get(REVIEW_STATUS_PARAM);
  const statusFilter: PayrollReviewStatusFilter =
    rawStatusFilter && isPayrollReviewStatusFilter(rawStatusFilter) ? rawStatusFilter : "";
  const rawIssueFilter = searchParams.get(REVIEW_ISSUE_PARAM);
  const issueFilter: PayrollReviewIssueFilter | "" =
    rawIssueFilter && isPayrollReviewIssueFilter(rawIssueFilter) ? rawIssueFilter : "";
  const roleFilter = searchParams.get(REVIEW_ROLE_PARAM) ?? "";

  const filteredItems = useMemo(
    () =>
      filterPayrollReviewItems(items, {
        search,
        status: statusFilter,
        issue: issueFilter,
        role: roleFilter,
      }),
    [items, issueFilter, roleFilter, search, statusFilter],
  );

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function openBreakdown(item: PayrollPeriodItemSummary) {
    setBreakdownItem(item);
  }

  return (
    <div className="space-y-4">
      <PayrollReviewKpiSummary
        summary={summary}
        period={period}
        settings={settings}
        hasGeneratedCut={hasGeneratedCut}
      />

      <div id="payroll-items">
        {items.length === 0 ? (
          <EmptyState
            title="No employees included in this payroll period."
            description="Generate payroll to begin reviewing employees."
            action={
              <GeneratePayrollCutButton
                periodId={period.id}
                hasGeneratedCut={hasGeneratedCut}
                formId={generateFormId}
              />
            }
          />
        ) : (
          <SectionCard
            title="Employee Review"
            description="Click an employee to open their payroll breakdown."
            contentClassName="p-0"
          >
            {hasGeneratedCut && summary.totalStaffCount > 0 ? (
              <div className="border-b border-border/70 p-4">
                <div className="grid gap-3 lg:grid-cols-4">
                  <Input
                    value={search}
                    onChange={(event) =>
                      updateParams({ [REVIEW_SEARCH_PARAM]: event.target.value })
                    }
                    placeholder="Search employee"
                    aria-label="Search employee"
                  />
                  <NativeSelect
                    value={statusFilter}
                    onChange={(event) =>
                      updateParams({
                        [REVIEW_STATUS_PARAM]:
                          event.target.value === "" ? null : event.target.value,
                      })
                    }
                    aria-label="Filter by status"
                  >
                    {STATUS_FILTERS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                  <NativeSelect
                    value={roleFilter}
                    onChange={(event) =>
                      updateParams({
                        [REVIEW_ROLE_PARAM]: event.target.value === "" ? null : event.target.value,
                      })
                    }
                    aria-label="Filter by role"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value || "all"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                  <NativeSelect
                    value={issueFilter}
                    onChange={(event) =>
                      updateParams({
                        [REVIEW_ISSUE_PARAM]:
                          event.target.value === "" ? null : event.target.value,
                      })
                    }
                    aria-label="Filter by issue"
                  >
                    {ISSUE_FILTERS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
            ) : null}

            {filteredItems.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No employees match these filters"
                  description="Try another search term or clear the active filters."
                />
              </div>
            ) : (
              <>
                <div className="hidden grid-cols-[minmax(0,1.2fr)_140px_160px_minmax(0,1fr)_40px] gap-3 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground lg:grid">
                  <span>Employee</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span className="text-right">Primary Action</span>
                  <span className="sr-only">More</span>
                </div>
                {filteredItems.map((item) => (
                  <PayrollReviewEmployeeRow
                    key={item.id}
                    periodId={period.id}
                    periodStatus={period.status}
                    item={item}
                    primaryIssue={resolvePrimaryEmployeeActionItem(item, period.id)}
                    onOpenBreakdown={() => openBreakdown(item)}
                  />
                ))}
              </>
            )}

            {filteredItems.length > 0 ? (
              <div className="border-t border-border/70 px-4 py-3">
                <DataTableRecordSummary totalItems={filteredItems.length} />
              </div>
            ) : null}
          </SectionCard>
        )}
      </div>

      <PayrollPeriodInfoCollapsible period={period} settings={settings} />

      <PayrollPeriodItemBreakdownDrawer
        periodId={period.id}
        item={breakdownItem}
        open={Boolean(breakdownItem)}
        onOpenChange={(open) => {
          if (!open) {
            setBreakdownItem(null);
          }
        }}
        hideTrigger
      />
    </div>
  );
}

function PayrollReviewEmployeeRow({
  periodId,
  periodStatus,
  item,
  primaryIssue,
  onOpenBreakdown,
}: {
  periodId: string;
  periodStatus: PayrollPeriodStatus;
  item: PayrollPeriodItemSummary;
  primaryIssue: PayrollEmployeeActionItem | null;
  onOpenBreakdown: () => void;
}) {
  const isLocked = periodStatus === "processing" || periodStatus === "finalized";
  const statusLabel = isLocked ? "Locked" : primaryIssue?.issueLabel ?? "Ready";
  const statusTone = isLocked
    ? "neutral"
    : primaryIssue?.severity === "blocking"
      ? "destructive"
      : primaryIssue?.severity === "warning"
        ? "warning"
        : "success";

  return (
    <div
      id={`payroll-item-${item.id}`}
      className="border-b border-border/70 last:border-b-0"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onOpenBreakdown}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenBreakdown();
          }
        }}
        className={cn(
          "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 focus-visible:ring-inset",
        )}
      >
        <div className="grid min-w-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_140px_160px_minmax(0,1fr)_40px] lg:items-center">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{item.fullName}</p>
          </div>
          <p className="truncate text-sm capitalize text-muted-foreground">
            {formatPayrollRoleLabel(item.role)}
          </p>
          <div>
            <StatusBadge tone={statusTone} variant="table">
              {statusLabel}
            </StatusBadge>
          </div>
          <div
            className="flex flex-wrap items-center justify-start gap-2 lg:justify-end"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {primaryIssue ? (
              primaryIssue.actionHref.startsWith("#") ? (
                <Button type="button" variant="outline" size="sm" onClick={onOpenBreakdown}>
                  {primaryIssue.actionLabel}
                </Button>
              ) : (
                <AppLink
                  href={primaryIssue.actionHref}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {primaryIssue.actionLabel}
                </AppLink>
              )
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={onOpenBreakdown}>
                View Payroll
              </Button>
            )}
          </div>
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">More actions for {item.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onOpenBreakdown}>View payroll breakdown</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <AppLink href={`/payroll/${periodId}/payslip/${item.id}/print`} target="_blank">
                    Print payslip
                  </AppLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <AppLink href={`/api/payroll/${periodId}/payslip/${item.id}/pdf`}>Download PDF</AppLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
