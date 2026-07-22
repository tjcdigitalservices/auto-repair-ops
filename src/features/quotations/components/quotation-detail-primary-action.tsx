"use client";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { PagePrimaryAction } from "@/components/shared/page-header-actions";
import { Button } from "@/components/ui/button";
import { approveQuotationAction } from "@/features/quotations/actions/quotation-actions";

export function QuotationDetailPrimaryAction({
  quotationId,
  quotationNumber,
  canEdit,
  canApprove,
}: {
  quotationId: string;
  quotationNumber: string;
  canEdit: boolean;
  canApprove: boolean;
}) {
  if (canEdit) {
    return (
      <PagePrimaryAction href={`/quotations/${quotationId}/edit`}>
        Edit Quotation
      </PagePrimaryAction>
    );
  }

  if (canApprove) {
    return (
      <ConfirmActionDialog
        trigger={({ openDialog }) => (
          <Button type="button" onClick={openDialog}>
            Convert to Job Order
          </Button>
        )}
        title={`Approve ${quotationNumber}?`}
        description="This will approve the quotation and create a linked job order."
        action={approveQuotationAction}
        fields={[{ name: "quotationId", value: quotationId }]}
        confirmLabel="Approve quotation"
        cancelLabel="Cancel"
        confirmVariant="default"
      />
    );
  }

  return null;
}
