"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LaborInlineCreateResult } from "@/features/labor/types";
import { toNumeric } from "@/features/quotations/utils";
import { formatMoneyInputValue, MONEY_INPUT_STEP } from "@/lib/currency";
import { useFormValues } from "@/lib/use-form-values";

const INITIAL_VALUES = {
  label: "",
  unitPrice: formatMoneyInputValue(0),
};

export function QuickCreateLaborDialog({
  onCreated,
  triggerLabel = "Add new labor item",
  triggerVariant = "addSubtle",
  triggerSize = "sm",
  initialLabel = "",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
}: {
  onCreated: (labor: LaborInlineCreateResult) => void;
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  initialLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  function setOpen(nextOpen: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    controlledOnOpenChange?.(nextOpen);
  }

  useEffect(() => {
    if (!open) {
      setInstanceKey((current) => current + 1);
    }
  }, [open]);

  return (
    <QuickCreateLaborDialogForm
      key={instanceKey}
      open={open}
      onOpenChange={setOpen}
      onCreated={onCreated}
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      hideTrigger={hideTrigger}
      initialLabel={initialLabel}
    />
  );
}

function QuickCreateLaborDialogForm({
  open,
  onOpenChange,
  onCreated,
  triggerLabel,
  triggerVariant,
  triggerSize,
  hideTrigger,
  initialLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (labor: LaborInlineCreateResult) => void;
  triggerLabel: string;
  triggerVariant: ButtonProps["variant"];
  triggerSize: ButtonProps["size"];
  hideTrigger: boolean;
  initialLabel: string;
}) {
  const { values, updateFormValue, setValues } = useFormValues({
    ...INITIAL_VALUES,
    label: initialLabel,
  });

  useEffect(() => {
    if (open) {
      setValues({
        ...INITIAL_VALUES,
        label: initialLabel,
      });
    }
  }, [initialLabel, open, setValues]);

  return (
    <ModalDialog
      title="Add new labor item"
      description="Save a reusable manual labor entry for this quotation workflow."
      size="md"
      open={open}
      onOpenChange={onOpenChange}
      trigger={
        hideTrigger
          ? undefined
          : ({ openDialog }) => (
              <Button
                type="button"
                variant={triggerVariant}
                size={triggerSize}
                onClick={openDialog}
              >
                <Plus className="size-4" />
                {triggerLabel}
              </Button>
            )
      }
    >
      {({ closeDialog }) => (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();

            const label = values.label.trim();
            if (!label) {
              return;
            }

            onCreated({
              id: crypto.randomUUID(),
              label,
              unitPrice: toNumeric(values.unitPrice),
            });
            onOpenChange(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="quickLaborLabel" required>
              Labor description
            </Label>
            <Input
              id="quickLaborLabel"
              value={values.label}
              onChange={(event) => updateFormValue("label", event.target.value)}
              placeholder="Engine removal, panel beating, diagnostics"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quickLaborPrice" required>
              Default unit price
            </Label>
            <Input
              id="quickLaborPrice"
              inputMode="decimal"
              type="number"
              step={MONEY_INPUT_STEP}
              value={values.unitPrice}
              onChange={(event) => updateFormValue("unitPrice", event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border/70 pt-5">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={!values.label.trim()}>
              Create labor item
            </Button>
          </div>
        </form>
      )}
    </ModalDialog>
  );
}
