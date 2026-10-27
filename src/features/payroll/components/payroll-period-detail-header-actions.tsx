"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Printer, RotateCcw } from "lucide-react";

import { PageHeaderActions } from "@/components/shared/page-header-actions";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { Button } from "@/components/ui/button";
import { GeneratePayrollCutButton } from "@/features/payroll/components/generate-payroll-cut-button";
import { useSandboxOptional } from "@/features/sandbox/use-bound-action";
import { PayrollLockValidationDialog } from "@/features/payroll/components/payroll-lock-validation-dialog";
import {
  PayrollPeriodHiddenStatusForm,
  PayrollPeriodStatusSubmit,
  submitPayrollPeriodHiddenStatusForm,
} from "@/features/payroll/components/payroll-period-status-submit";
import {
  computePayrollLockValidation,
  countEmployeesWithBlockingIssues,
} from "@/features/payroll/payroll-validation";
import type {
  PayrollPeriodDetailSummary,
  PayrollPeriodItemSummary,
  PayrollPeriodStatus,
} from "@/features/payroll/types";

export function PayrollPeriodDetailHeaderActions({
  periodId,
  periodEndDate,
  status,
  hasGeneratedCut,
  items,
  summary,
}: {
  periodId: string;
  periodEndDate: string;
  status: PayrollPeriodStatus;
  hasGeneratedCut: boolean;
  items: PayrollPeriodItemSummary[];
  summary: PayrollPeriodDetailSummary;
}) {
  const sandbox = useSandboxOptional();
  const router = useRouter();
  const pathname = usePathname();
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const blockingEmployeeCount = countEmployeesWithBlockingIssues(items, periodId);
  const validation = useMemo(
    () => computePayrollLockValidation(items, summary),
    [items, summary],
  );

  const isFinalized = status === "finalized";
  const remittanceMonth = periodEndDate.slice(0, 7);
  const generateFormId = `payroll-generate-cut-${periodId}`;
  const returnDraftFormId = `payroll-return-draft-${periodId}`;
  const lockFormId = `payroll-lock-${periodId}`;
  const showOverflow = hasGeneratedCut || status === "processing" || isFinalized;

  function scrollToEmployees() {
    document.getElementById("payroll-items")?.scrollIntoView({ behavior: "smooth" });
    router.replace(`${pathname}?issue=blocking_issues`, { scroll: false });
  }

  return (
    <>
      {status === "processing" ? (
        <PayrollPeriodHiddenStatusForm
          periodId={periodId}
          nextStatus="draft"
          formId={returnDraftFormId}
        />
      ) : null}

      {status === "draft" && hasGeneratedCut ? (
        <PayrollPeriodHiddenStatusForm
          periodId={periodId}
          nextStatus="processing"
          formId={lockFormId}
        />
      ) : null}

      <PageHeaderActions
        primary={renderPrimaryAction({
          periodId,
          status,
          hasGeneratedCut,
          isFinalized,
          generateFormId,
          totalStaffCount: summary.totalStaffCount,
          blockingEmployeeCount,
          onRequestLock: () => setLockDialogOpen(true),
          onResolveIssues: scrollToEmployees,
        })}
        overflow={
          showOverflow ? (
            <TableRowActionsMenu label="Payroll period actions" variant="page">
              {!isFinalized && hasGeneratedCut ? (
                <TableRowActionsMenuButton
                  label="Refresh cut summary"
                  icon={RotateCcw}
                  onSelect={() => {
                    const form = document.getElementById(generateFormId) as HTMLFormElement | null;
                    form?.requestSubmit();
                  }}
                />
              ) : null}
              {hasGeneratedCut ? (
                <>
                  <TableRowActionsMenuButton
                    label="Print summary"
                    icon={Printer}
                    onSelect={() =>
                      window.open(`/payroll/${periodId}/print`, "_blank", "noopener,noreferrer")
                    }
                  />
                  {sandbox ? null : (
                    <TableRowActionsMenuLink
                      href={`/api/payroll/${periodId}/pdf`}
                      label="Download PDF"
                      icon={Download}
                    />
                  )}
                </>
              ) : null}
              {isFinalized ? (
                <TableRowActionsMenuLink
                  href={`/payroll?tab=remittance&month=${encodeURIComponent(remittanceMonth)}`}
                  label="Remittance summary"
                  icon={FileSpreadsheet}
                />
              ) : null}
              {status === "processing" ? (
                <TableRowActionsMenuButton
                  label="Return to draft"
                  onSelect={() => submitPayrollPeriodHiddenStatusForm(returnDraftFormId)}
                />
              ) : null}
            </TableRowActionsMenu>
          ) : null
        }
      />

      <PayrollLockValidationDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        validation={validation}
        onReviewIssues={scrollToEmployees}
        onConfirmLock={() => {
          submitPayrollPeriodHiddenStatusForm(lockFormId);
          setLockDialogOpen(false);
        }}
      />
    </>
  );
}

function renderPrimaryAction({
  periodId,
  status,
  hasGeneratedCut,
  isFinalized,
  generateFormId,
  totalStaffCount,
  blockingEmployeeCount,
  onRequestLock,
  onResolveIssues,
}: {
  periodId: string;
  status: PayrollPeriodStatus;
  hasGeneratedCut: boolean;
  isFinalized: boolean;
  generateFormId: string;
  totalStaffCount: number;
  blockingEmployeeCount: number;
  onRequestLock: () => void;
  onResolveIssues: () => void;
}) {
  if (isFinalized && hasGeneratedCut) {
    return (
      <Button asChild>
        <Link href={`/payroll/${periodId}/print`} target="_blank" rel="noreferrer">
          Print summary
        </Link>
      </Button>
    );
  }

  if (status === "processing" && hasGeneratedCut) {
    return (
      <PayrollPeriodStatusSubmit
        periodId={periodId}
        nextStatus="finalized"
        pendingLabel="Finalizing..."
        disabled={!hasGeneratedCut}
      >
        Finalize period
      </PayrollPeriodStatusSubmit>
    );
  }

  if (status === "draft" && hasGeneratedCut && blockingEmployeeCount > 0) {
    return (
      <Button type="button" onClick={onResolveIssues}>
        Resolve {blockingEmployeeCount} Issue{blockingEmployeeCount === 1 ? "" : "s"}
      </Button>
    );
  }

  if (status === "draft" && hasGeneratedCut && blockingEmployeeCount === 0) {
    return (
      <Button type="button" onClick={onRequestLock}>
        Lock Payroll
      </Button>
    );
  }

  if (!hasGeneratedCut || totalStaffCount === 0) {
    return (
      <GeneratePayrollCutButton
        periodId={periodId}
        hasGeneratedCut={hasGeneratedCut}
        compact
        formId={generateFormId}
      />
    );
  }

  return null;
}
