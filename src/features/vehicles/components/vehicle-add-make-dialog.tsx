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
import { createVehicleMakeAction } from "@/features/vehicles/actions/vehicle-lookup-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

function AddMakeForm({ closeDialog }: { closeDialog: () => void }) {
  const [state, formAction] = useActionState(createVehicleMakeAction, INITIAL_FORM_ACTION_STATE);
  const form = useFormValues({
    name: "",
    sortOrder: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vehicleMakeName" required>
          Make name
        </Label>
        <Input
          id="vehicleMakeName"
          name="name"
          placeholder="Toyota"
          autoFocus
          value={form.values.name}
          onChange={(event) => form.updateFormValue("name", event.target.value)}
          className={fieldControlClassName(state.fieldErrors, "name")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "name",
            required: true,
            errorId: fieldErrorId("make-name"),
          })}
        />
        <FieldError errors={state.fieldErrors} name="name" id={fieldErrorId("make-name")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicleMakeSortOrder" optional>
          Sort order
        </Label>
        <Input
          id="vehicleMakeSortOrder"
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
          Add make
        </SubmitButton>
      </div>
    </form>
  );
}

export function VehicleAddMakeDialog() {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="Add make"
      description="Create a new vehicle make for the internal registration catalog."
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
          Add make
        </Button>
      )}
    >
      {({ closeDialog }) => <AddMakeForm key={dialogInstance} closeDialog={closeDialog} />}
    </ModalDialog>
  );
}
