"use client";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { PagePrimaryAction } from "@/components/shared/page-header-actions";
import { Button } from "@/components/ui/button";
import { approveQuotationAction } from "@/features/quotations/actions/quotation-actions";

export function QuotationDetailPrimaryAction({
  quotationId,
  quotationNumber,
  canApprove,
  isApproved,
}: {
  quotationId: string;
  quotationNumber: string;
  canApprove: boolean;
  isApproved: boolean;
}) {
  if (isApproved) {
    return (
      <PagePrimaryAction href={`/quotations/${quotationId}/revise`}>
        Revise Quote
      </PagePrimaryAction>
    );
  }

  if (canApprove) {
    return (
      <ConfirmActionDialog
        trigger={({ openDialog }) => (
          <Button type="button" onClick={openDialog}>
            Approve Quote
          </Button>
        )}
        title={`Approve ${quotationNumber}?`}
        description="This will approve the quotation and create a linked job order."
        action={approveQuotationAction}
        fields={[{ name: "quotationId", value: quotationId }]}
        confirmLabel="Approve Quote"
        cancelLabel="Cancel"
        confirmVariant="default"
      />
    );
  }

  return null;
}
