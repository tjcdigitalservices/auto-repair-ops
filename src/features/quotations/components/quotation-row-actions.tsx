"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { deleteQuotationAction } from "@/features/quotations/actions/quotation-actions";
import { deleteSandboxQuotationAction } from "@/features/sandbox/form-actions";
import { useBoundFormAction } from "@/features/sandbox/use-bound-action";
import type { QuotationStatus } from "@/features/quotations/types";
import { canDeleteQuotation } from "@/features/quotations/utils";

export function QuotationRowActions({
  quotationId,
  quotationNumber,
  status,
}: {
  quotationId: string;
  quotationNumber: string;
  status: QuotationStatus;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteAction = useBoundFormAction(deleteQuotationAction, deleteSandboxQuotationAction);
  const canEdit = status === "draft" || status === "pending_approval";
  const canRevise = status === "approved";
  const canDelete = canDeleteQuotation(status);

  return (
    <>
      <TableRowActionsMenu label={`Open row actions for ${quotationNumber}`}>
        <TableRowActionsMenuLink
          href={`/quotations/${quotationId}`}
          label="View quotation"
          iconName="eye"
        />
        {canEdit ? (
          <TableRowActionsMenuLink
            href={`/quotations/${quotationId}/edit`}
            label="Edit Quotation"
            iconName="pencil"
          />
        ) : null}
        {canRevise ? (
          <TableRowActionsMenuLink
            href={`/quotations/${quotationId}/revise`}
            label="Revise Quote"
            iconName="pencil"
          />
        ) : null}
        {canDelete ? (
          <TableRowActionsMenuButton
            label="Delete quotation"
            icon={Trash2}
            tone="destructive"
            onSelect={() => setIsDeleteOpen(true)}
          />
        ) : null}
      </TableRowActionsMenu>
      {canDelete ? (
        <ConfirmActionDialog
          title={`Delete ${quotationNumber}?`}
          description="This quotation and its line items will be removed permanently. Approved quotations must be managed through the linked job order instead."
          confirmLabel="Delete quotation"
          cancelLabel="Keep quotation"
          action={deleteAction}
          fields={[{ name: "quotationId", value: quotationId }]}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
        />
      ) : null}
    </>
  );
}
