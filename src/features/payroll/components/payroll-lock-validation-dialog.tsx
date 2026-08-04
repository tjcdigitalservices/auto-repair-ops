"use client";

import { Check, CircleAlert } from "lucide-react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import type { PayrollLockValidationResult } from "@/features/payroll/types";
import { cn } from "@/lib/utils";

export function PayrollLockValidationDialog({
  open,
  onOpenChange,
  validation,
  onReviewIssues,
  onConfirmLock,
  isLocking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validation: PayrollLockValidationResult;
  onReviewIssues: () => void;
  onConfirmLock: () => void;
  isLocking?: boolean;
}) {
  const canLock = validation.canLock;

  return (
    <ModalDialog
      title={canLock ? "Payroll Validation" : "Cannot Lock Payroll"}
      description={
        canLock
          ? "Review the checklist below before locking this payroll period."
          : `${validation.blockingIssueTypes} blocking issue${validation.blockingIssueTypes === 1 ? "" : "s"} must be resolved first.`
      }
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      {({ closeDialog }) => (
        <div className="space-y-4">
          <ul className="space-y-2">
            {validation.checks.map((check) => (
              <li
                key={check.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  check.passed ? "text-foreground" : "bg-muted/30 text-foreground",
                )}
              >
                {check.passed ? (
                  <Check className="size-4 shrink-0 text-success" />
                ) : check.severity === "blocking" ? (
                  <CircleAlert className="size-4 shrink-0 text-destructive" />
                ) : (
                  <CircleAlert className="size-4 shrink-0 text-warning" />
                )}
                <span>{check.label}</span>
              </li>
            ))}
          </ul>

          {!canLock ? (
            <p className="text-sm font-medium text-destructive">
              {validation.blockingIssueTypes} Blocking Issue
              {validation.blockingIssueTypes === 1 ? "" : "s"} Remaining
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            {canLock ? (
              <Button type="button" onClick={onConfirmLock} disabled={isLocking}>
                {isLocking ? "Locking..." : "Lock Payroll"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  closeDialog();
                  onReviewIssues();
                }}
              >
                Review Issues
              </Button>
            )}
          </div>
        </div>
      )}
    </ModalDialog>
  );
}
