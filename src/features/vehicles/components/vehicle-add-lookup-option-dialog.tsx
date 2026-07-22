"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import {
  FieldError,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVehicleLookupOptionAction } from "@/features/vehicles/actions/vehicle-lookup-actions";
import type { VehicleLookupType } from "@/features/vehicles/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

function AddLookupOptionForm({
  closeDialog,
  lookupType,
}: {
  closeDialog: () => void;
  lookupType: VehicleLookupType;
}) {
  const [state, formAction] = useActionState(createVehicleLookupOptionAction, INITIAL_FORM_ACTION_STATE);
  const form = useFormValues({
    label: "",
    sortOrder: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="lookupType" value={lookupType} />

      <div className="space-y-2">
        <Label htmlFor={`${lookupType}-label`} required>
          Label
        </Label>
        <Input
          id={`${lookupType}-label`}
          name="label"
          placeholder={getPlaceholder(lookupType)}
          autoFocus
          value={form.values.label}
          onChange={(event) => form.updateFormValue("label", event.target.value)}
          className={fieldControlClassName(state.fieldErrors, "label")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "label",
            required: true,
            errorId: fieldErrorId("label"),
          })}
        />
        <FieldError errors={state.fieldErrors} name="label" id={fieldErrorId("label")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${lookupType}-sortOrder`} optional>
          Sort order
        </Label>
        <Input
          id={`${lookupType}-sortOrder`}
          name="sortOrder"
          inputMode="numeric"
          placeholder="0"
          value={form.values.sortOrder}
          onChange={(event) => form.updateFormValue("sortOrder", event.target.value)}
        />
        <FieldError errors={state.fieldErrors} name="sortOrder" />
      </div>

      <FormStatusMessage message={state.message} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Adding...">
          <Plus className="size-4" />
          Add option
        </SubmitButton>
      </div>
    </form>
  );
}

export function VehicleAddLookupOptionDialog({
  lookupType,
  label,
}: {
  lookupType: VehicleLookupType;
  label: string;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title={`Add ${label.toLowerCase()}`}
      description="Create a dropdown value used during vehicle registration."
      trigger={({ openDialog }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        >
          <Plus className="size-4" />
          Add option
        </Button>
      )}
    >
      {({ closeDialog }) => (
        <AddLookupOptionForm key={dialogInstance} closeDialog={closeDialog} lookupType={lookupType} />
      )}
    </ModalDialog>
  );
}

function getPlaceholder(lookupType: VehicleLookupType) {
  if (lookupType === "transmission") {
    return "Automatic";
  }

  if (lookupType === "fuel_type") {
    return "Diesel";
  }

  return "Gray";
}
