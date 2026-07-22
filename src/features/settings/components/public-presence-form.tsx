"use client";

import { useActionState } from "react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { FormSection } from "@/components/shared/form-section";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePublicPresenceSettingsAction } from "@/features/settings/actions/settings-actions";
import {
  STORE_HOUR_DAY_NAMES,
  storeHourFieldName,
} from "@/features/settings/store-hours.shared";
import type { PublicPresenceSettingsValues } from "@/features/settings/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function PublicPresenceForm({
  initialValues,
}: {
  initialValues: PublicPresenceSettingsValues;
}) {
  const [state, formAction] = useActionState(
    updatePublicPresenceSettingsAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const initialFormValues: Record<string, string> = {
    websiteUrl: initialValues.websiteUrl,
    facebookUrl: initialValues.facebookUrl,
    facebookLabel: initialValues.facebookLabel,
    ...initialValues.storeHours,
  };
  const { values, updateFormValue } = useFormValues(initialFormValues);

  return (
    <FormSection
      title="Public presence"
      description="Optional links and store hours used on your public website and printed documents."
    >
      <form action={formAction} className="space-y-5">
        <FormRequiredFieldsNote />
        <FormStatusMessage message={state.message} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="websiteUrl" optional>
              Website URL
            </Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://www.yourshop.com"
              value={values.websiteUrl}
              onChange={(event) => updateFormValue("websiteUrl", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "websiteUrl")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "websiteUrl",
                required: false,
                errorId: fieldErrorId("websiteUrl"),
              })}
            />
            <FieldError
              errors={state.fieldErrors}
              name="websiteUrl"
              id={fieldErrorId("websiteUrl")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebookUrl" optional>
              Facebook page URL
            </Label>
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              placeholder="https://www.facebook.com/yourpage"
              value={values.facebookUrl}
              onChange={(event) => updateFormValue("facebookUrl", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "facebookUrl")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "facebookUrl",
                required: false,
                errorId: fieldErrorId("facebookUrl"),
              })}
            />
            <FieldError
              errors={state.fieldErrors}
              name="facebookUrl"
              id={fieldErrorId("facebookUrl")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebookLabel" optional>
            Facebook page name
          </Label>
          <Input
            id="facebookLabel"
            name="facebookLabel"
            placeholder="Shown on printed documents (e.g. TJ&C Auto Shop)"
            value={values.facebookLabel}
            onChange={(event) => updateFormValue("facebookLabel", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "facebookLabel")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "facebookLabel",
              required: false,
              errorId: fieldErrorId("facebookLabel"),
            })}
          />
          <p className="text-xs text-muted-foreground">
            Display label for your Facebook page on document footers. The URL above
            is used on the public website.
          </p>
          <FieldError
            errors={state.fieldErrors}
            name="facebookLabel"
            id={fieldErrorId("facebookLabel")}
          />
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Store hours</p>
            <p className="text-xs text-muted-foreground">
              Shown on your public website contact page and footer. Leave a day
              blank to show as Closed.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {STORE_HOUR_DAY_NAMES.map((day) => {
              const fieldName = storeHourFieldName(day);
              return (
                <div key={day} className="space-y-2">
                  <Label htmlFor={fieldName} optional>
                    {day}
                  </Label>
                  <Input
                    id={fieldName}
                    name={fieldName}
                    placeholder="7:00 AM – 5:00 PM"
                    value={values[fieldName] ?? ""}
                    onChange={(event) =>
                      updateFormValue(fieldName, event.target.value)
                    }
                    className={fieldControlClassName(state.fieldErrors, fieldName)}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: fieldName,
                      required: false,
                      errorId: fieldErrorId(fieldName),
                    })}
                  />
                  <FieldError
                    errors={state.fieldErrors}
                    name={fieldName}
                    id={fieldErrorId(fieldName)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <SubmitButton pendingLabel="Saving...">Save public presence</SubmitButton>
      </form>
    </FormSection>
  );
}
