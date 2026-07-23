"use client";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import type { ConfirmActionField } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";

export function ReviseApprovedDocumentDialog({
  title,
  description,
  action,
  fields,
  triggerLabel = "Revise",
  confirmLabel = "Create Revision",
  cancelLabel = "Cancel",
  open,
  onOpenChange,
}: {
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  fields: ConfirmActionField[];
  triggerLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <ConfirmActionDialog
      trigger={
        open === undefined
          ? ({ openDialog }) => (
              <Button type="button" onClick={openDialog}>
                {triggerLabel}
              </Button>
            )
          : undefined
      }
      title={title}
      description={description}
      action={action}
      fields={fields}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      confirmVariant="default"
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
