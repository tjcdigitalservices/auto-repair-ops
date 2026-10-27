"use client";

import { useState } from "react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { createSandboxVehicleModelAction } from "@/features/sandbox/form-actions";
import { useBoundAction } from "@/features/sandbox/use-bound-action";
import { createVehicleModelAction } from "@/features/vehicles/actions/vehicle-lookup-actions";
import type { VehicleMakeItem } from "@/features/vehicles/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

function AddModelForm({
  closeDialog,
  makes,
  defaultMakeId = "",
}: {
  closeDialog: () => void;
  makes: VehicleMakeItem[];
  defaultMakeId?: string;
}) {
  const [state, formAction] = useBoundAction(
    createVehicleModelAction,
    createSandboxVehicleModelAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const form = useFormValues({
    makeId: defaultMakeId,
    name: "",
    sortOrder: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vehicleModelMakeId" required>
          Make
        </Label>
        <NativeSelect
          id="vehicleModelMakeId"
          name="makeId"
          value={form.values.makeId}
          className={fieldControlClassName(state.fieldErrors, "makeId")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "makeId",
            required: true,
            errorId: fieldErrorId("model-makeId"),
          })}
          onChange={(event) => form.updateFormValue("makeId", event.target.value)}
        >
          <option value="">Select make</option>
          {makes.map((make) => (
            <option key={make.id} value={make.id}>
              {make.name}
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors} name="makeId" id={fieldErrorId("model-makeId")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicleModelName" required>
          Model name
        </Label>
        <Input
          id="vehicleModelName"
          name="name"
          placeholder="Vios"
          autoFocus={Boolean(defaultMakeId)}
          value={form.values.name}
          onChange={(event) => form.updateFormValue("name", event.target.value)}
          className={fieldControlClassName(state.fieldErrors, "name")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "name",
            required: true,
            errorId: fieldErrorId("model-name"),
          })}
        />
        <FieldError errors={state.fieldErrors} name="name" id={fieldErrorId("model-name")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicleModelSortOrder" optional>
          Sort order
        </Label>
        <Input
          id="vehicleModelSortOrder"
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
        <SubmitButton pendingLabel="Adding..." disabled={makes.length === 0}>
          <Plus className="size-4" />
          Add model
        </SubmitButton>
      </div>
    </form>
  );
}

export function VehicleAddModelDialog({
  makes,
  defaultMakeId,
  triggerLabel = "Add model",
  triggerVariant = "bluePrimary",
}: {
  makes: VehicleMakeItem[];
  defaultMakeId?: string;
  triggerLabel?: string;
  triggerVariant?: "outline" | "bluePrimary";
}) {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="Add model"
      description="Add a model under an existing make in the internal registration catalog."
      trigger={({ openDialog }) => (
        <Button
          type="button"
          size="sm"
          variant={triggerVariant === "bluePrimary" ? "bluePrimary" : "outline"}
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        >
          <Plus className="size-4" />
          {triggerLabel}
        </Button>
      )}
    >
      {({ closeDialog }) => (
        <AddModelForm
          key={`${dialogInstance}:${defaultMakeId ?? ""}`}
          closeDialog={closeDialog}
          makes={makes}
          defaultMakeId={defaultMakeId}
        />
      )}
    </ModalDialog>
  );
}
