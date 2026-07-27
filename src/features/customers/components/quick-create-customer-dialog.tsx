"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { InlineCreatePanel } from "@/components/shared/inline-create-panel";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { quickCreateCustomerAction } from "@/features/customers/actions/inline-customer-actions";
import {
  INITIAL_INLINE_CUSTOMER_CREATE_ACTION_STATE,
  type InlineCustomerCreateActionState,
} from "@/features/customers/inline-customer-action-state";
import type { CustomerOption } from "@/features/customers/types";
import { useFormValues } from "@/lib/use-form-values";

const INITIAL_VALUES = {
  firstName: "",
  lastName: "",
  contactNumber: "",
  email: "",
  address: "",
  notes: "",
};

export function QuickCreateCustomerDialog({
  open,
  onOpenChange,
  initialLastName = "",
  initialFirstName = "",
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLastName?: string;
  initialFirstName?: string;
  onCreated: (customer: CustomerOption) => void;
}) {
  const formKeyRef = useRef(0);

  useEffect(() => {
    if (!open) {
      formKeyRef.current += 1;
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <QuickCreateCustomerDialogForm
      key={formKeyRef.current}
      open={open}
      onOpenChange={onOpenChange}
      initialLastName={initialLastName}
      initialFirstName={initialFirstName}
      onCreated={onCreated}
    />
  );
}

function QuickCreateCustomerDialogForm({
  open,
  onOpenChange,
  initialLastName,
  initialFirstName,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLastName: string;
  initialFirstName: string;
  onCreated: (customer: CustomerOption) => void;
}) {
  const [state, formAction] = useActionState<
    InlineCustomerCreateActionState,
    FormData
  >(quickCreateCustomerAction, INITIAL_INLINE_CUSTOMER_CREATE_ACTION_STATE);
  const { values, updateFormValue, setValues } = useFormValues({
    ...INITIAL_VALUES,
    firstName: initialFirstName,
    lastName: initialLastName,
  });

  useEffect(() => {
    if (state.status === "success" && state.data) {
      onCreated(state.data);
      onOpenChange(false);
      setValues(INITIAL_VALUES);
    }
  }, [onCreated, onOpenChange, setValues, state.data, state.status]);

  return (
    <InlineCreatePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Customer"
      description="Add the customer without leaving vehicle registration."
    >
      {({ closePanel }) => (
        <form action={formAction} className="space-y-4">
          <FormStatusMessage message={state.message} />
          <FormRequiredFieldsNote />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inlineCustomerFirstName" required>
                First name
              </Label>
              <Input
                id="inlineCustomerFirstName"
                name="firstName"
                value={values.firstName}
                className={fieldControlClassName(state.fieldErrors, "firstName")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "firstName",
                  required: true,
                  errorId: fieldErrorId("firstName"),
                })}
                onChange={(event) => updateFormValue("firstName", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="firstName" id={fieldErrorId("firstName")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inlineCustomerLastName" required>
                Last name
              </Label>
              <Input
                id="inlineCustomerLastName"
                name="lastName"
                value={values.lastName}
                className={fieldControlClassName(state.fieldErrors, "lastName")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "lastName",
                  required: true,
                  errorId: fieldErrorId("lastName"),
                })}
                onChange={(event) => updateFormValue("lastName", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="lastName" id={fieldErrorId("lastName")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inlineCustomerContactNumber" required>
              Mobile number
            </Label>
            <Input
              id="inlineCustomerContactNumber"
              name="contactNumber"
              value={values.contactNumber}
              placeholder="09xx xxx xxxx"
              className={fieldControlClassName(state.fieldErrors, "contactNumber")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "contactNumber",
                required: true,
                errorId: fieldErrorId("contactNumber"),
              })}
              onChange={(event) => updateFormValue("contactNumber", event.target.value)}
            />
            <FieldError
              errors={state.fieldErrors}
              name="contactNumber"
              id={fieldErrorId("contactNumber")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inlineCustomerEmail" optional>
              Email
            </Label>
            <Input
              id="inlineCustomerEmail"
              name="email"
              type="email"
              value={values.email}
              className={fieldControlClassName(state.fieldErrors, "email")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "email",
                required: false,
                errorId: fieldErrorId("email"),
              })}
              onChange={(event) => updateFormValue("email", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="email" id={fieldErrorId("email")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inlineCustomerAddress" optional>
              Address
            </Label>
            <Textarea
              id="inlineCustomerAddress"
              name="address"
              value={values.address}
              className={fieldControlClassName(state.fieldErrors, "address")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "address",
                required: false,
                errorId: fieldErrorId("address"),
              })}
              onChange={(event) => updateFormValue("address", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="address" id={fieldErrorId("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inlineCustomerNotes" optional>
              Notes
            </Label>
            <Textarea
              id="inlineCustomerNotes"
              name="notes"
              value={values.notes}
              className={fieldControlClassName(state.fieldErrors, "notes")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "notes",
                required: false,
                errorId: fieldErrorId("notes"),
              })}
              onChange={(event) => updateFormValue("notes", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="notes" id={fieldErrorId("notes")} />
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <SubmitButton pendingLabel="Creating...">Save customer</SubmitButton>
            <button
              type="button"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
              onClick={closePanel}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </InlineCreatePanel>
  );
}
