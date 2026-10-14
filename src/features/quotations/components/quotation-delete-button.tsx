"use client";

import { useState } from "react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { deleteQuotationAction } from "@/features/quotations/actions/quotation-actions";
import { deleteSandboxQuotationAction } from "@/features/sandbox/form-actions";
import { useBoundFormAction } from "@/features/sandbox/use-bound-action";

export function QuotationDeleteButton({
  quotationId,
  quotationNumber,
}: {
  quotationId: string;
  quotationNumber: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const deleteAction = useBoundFormAction(deleteQuotationAction, deleteSandboxQuotationAction);

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setIsOpen(true)}>
        Delete quotation
      </Button>
      <ConfirmActionDialog
        title={`Delete ${quotationNumber}?`}
        description="This quotation and its line items will be removed permanently."
        confirmLabel="Delete quotation"
        cancelLabel="Keep quotation"
        action={deleteAction}
        fields={[{ name: "quotationId", value: quotationId }]}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
