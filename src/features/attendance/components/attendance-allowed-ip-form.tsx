"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAttendanceAllowedIpAction } from "@/features/attendance/actions/timekeeping-actions";
import { addSandboxAllowedIpAction } from "@/features/sandbox/form-actions";
import { useBoundAction } from "@/features/sandbox/use-bound-action";
import type { AttendanceAllowedIpFormValues } from "@/features/attendance/types";
import { INITIAL_TIMEKEEPING_ACTION_STATE } from "@/features/attendance/utils";
import { useFormValues } from "@/lib/use-form-values";

export function AttendanceAllowedIpForm({
  currentDetectedIp,
  closeDialog,
}: {
  currentDetectedIp: string | null;
  closeDialog?: () => void;
}) {
  const [state, formAction] = useBoundAction(
    addAttendanceAllowedIpAction,
    addSandboxAllowedIpAction,
    INITIAL_TIMEKEEPING_ACTION_STATE,
  );
  const { values, setValues, updateFormValue } = useFormValues<AttendanceAllowedIpFormValues>({
    ipAddress: "",
    label: "",
  });

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    setValues({
      ipAddress: "",
      label: "",
    });
    closeDialog?.();
  }, [closeDialog, setValues, state.status]);

  return (
    <form action={formAction} className="space-y-4">
      <FormRequiredFieldsNote />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="attendanceAllowedIpAddress" required>
            Public IP address
          </Label>
          <Input
            id="attendanceAllowedIpAddress"
            name="ipAddress"
            value={values.ipAddress}
            onChange={(event) => updateFormValue("ipAddress", event.target.value)}
            placeholder="203.0.113.10"
            autoComplete="off"
            className={fieldControlClassName(state.fieldErrors, "ipAddress")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "ipAddress",
              required: true,
              errorId: fieldErrorId("ipAddress"),
            })}
          />
          <p className="text-xs text-muted-foreground">
            Use the branch&apos;s public internet IP, not a local address like 192.168.1.9.
          </p>
          <FieldError errors={state.fieldErrors} name="ipAddress" id={fieldErrorId("ipAddress")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attendanceAllowedIpLabel" optional>
            Label
          </Label>
          <Input
            id="attendanceAllowedIpLabel"
            name="label"
            value={values.label}
            className={fieldControlClassName(state.fieldErrors, "label")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "label",
              required: false,
              errorId: fieldErrorId("label"),
            })}
            onChange={(event) => updateFormValue("label", event.target.value)}
            placeholder="Main fiber line"
          />
          <FieldError errors={state.fieldErrors} name="label" id={fieldErrorId("label")} />
        </div>

        {currentDetectedIp ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => updateFormValue("ipAddress", currentDetectedIp)}
          >
            Use detected public IP
          </Button>
        ) : null}
      </div>

      <div className="flex justify-end gap-2">
        {closeDialog ? (
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
        ) : null}
        <SubmitButton pendingLabel="Adding...">
          <Plus className="size-4" />
          Add IP
        </SubmitButton>
      </div>

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />
      {state.status === "success" && !closeDialog ? (
        <p className="text-sm text-emerald-700">{state.message}</p>
      ) : null}
    </form>
  );
}
