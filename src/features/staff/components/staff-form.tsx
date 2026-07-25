"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
  formSelectClassName,
} from "@/components/shared/form-status";
import { FormStickyActions } from "@/components/shared/form-sticky-actions";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_STAFF_ACTION_STATE } from "@/features/staff/types";
import { useFormValues } from "@/lib/use-form-values";
import { createStaffAction, updateStaffAction } from "@/features/staff/actions/staff-actions";
import { StaffPortalLoginSuccess } from "@/features/staff/components/staff-portal-login-success";
import { StaffPortalLoginDomainFix } from "@/features/staff/components/staff-portal-login-domain-fix";
import { isMechanicPortalUsername } from "@/features/staff/mechanic-login";
import { getDefaultPayrollEligibilityForRole, type StaffFormValues } from "@/features/staff/types";

export function StaffForm({
  mode,
  initialValues,
  portalEmailDomain,
}: {
  mode: "create" | "edit";
  initialValues: StaffFormValues;
  portalEmailDomain: string;
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createStaffAction : updateStaffAction,
    INITIAL_STAFF_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);
  const [payrollEligibilityTouched, setPayrollEligibilityTouched] = useState(false);
  const isMechanic = values.role === "mechanic";
  const hasLinkedPortalAccount = Boolean(values.portalUsername);
  const hasLegacyPortalDomain =
    mode === "edit" &&
    hasLinkedPortalAccount &&
    values.portalUsername &&
    !isMechanicPortalUsername(values.portalUsername, portalEmailDomain);

  function handleRoleChange(nextRole: StaffFormValues["role"]) {
    updateFormValue("role", nextRole);

    if (!payrollEligibilityTouched) {
      updateFormValue("isPayrollEligible", getDefaultPayrollEligibilityForRole(nextRole));
    }
  }

  if (state.portalLogin) {
    return (
      <StaffPortalLoginSuccess
        staffName={state.portalLogin.staffName}
        username={state.portalLogin.username}
        temporaryPassword={state.portalLogin.temporaryPassword}
      />
    );
  }

  return (
    <>
    <form action={formAction} className="space-y-6">
      {initialValues.staffId ? <input type="hidden" name="staffId" value={initialValues.staffId} /> : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Staff record" : "Edit staff"}</CardTitle>
          <CardDescription>
            Staff records support mechanic assignment, attendance, and later productivity reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRequiredFieldsNote />
          <FormStatusMessage message={state.message} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" required>First name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={values.firstName}
                className={fieldControlClassName(state.fieldErrors, "firstName")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "firstName", required: true, errorId: fieldErrorId("firstName") })}
                onChange={(event) => updateFormValue("firstName", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="firstName" id={fieldErrorId("firstName")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" required>Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={values.lastName}
                className={fieldControlClassName(state.fieldErrors, "lastName")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "lastName", required: true, errorId: fieldErrorId("lastName") })}
                onChange={(event) => updateFormValue("lastName", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="lastName" id={fieldErrorId("lastName")} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staffCode" optional>Staff ID</Label>
              <Input
                id="staffCode"
                name="staffCode"
                value={values.staffCode}
                readOnly
                placeholder={mode === "create" ? "Generated after creation" : ""}
                className="bg-muted/40 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used for the staff roster and physical ID cards.
              </p>
              <FieldError errors={state.fieldErrors} name="staffCode" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" required>Role</Label>
              <select
                id="role"
                name="role"
                value={values.role}
                className={formSelectClassName(state.fieldErrors, "role")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "role", required: true, errorId: fieldErrorId("role") })}
                onChange={(event) => handleRoleChange(event.target.value as StaffFormValues["role"])}
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="mechanic">Mechanic</option>
                <option value="cashier">Cashier</option>
                <option value="inventory_staff">Inventory staff</option>
                <option value="service_advisor">Service advisor</option>
              </select>
              <FieldError errors={state.fieldErrors} name="role" id={fieldErrorId("role")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="documentTitle" optional>Document title / Print title</Label>
              <Input
                id="documentTitle"
                name="documentTitle"
                value={values.documentTitle}
                className={fieldControlClassName(state.fieldErrors, "documentTitle")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "documentTitle",
                  required: false,
                  errorId: fieldErrorId("documentTitle"),
                })}
                onChange={(event) => updateFormValue("documentTitle", event.target.value)}
                placeholder="Shown on print/PDF documents"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Customer-facing documents use this instead of the internal staff role.
              </p>
              <FieldError errors={state.fieldErrors} name="documentTitle" id={fieldErrorId("documentTitle")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" required>Status</Label>
              <select
                id="status"
                name="status"
                value={values.status}
                className={formSelectClassName(state.fieldErrors, "status")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "status", required: true, errorId: fieldErrorId("status") })}
                onChange={(event) => updateFormValue("status", event.target.value as StaffFormValues["status"])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <FieldError errors={state.fieldErrors} name="status" id={fieldErrorId("status")} />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Include in payroll</p>
                <p className="text-sm text-muted-foreground">
                  Payroll pages and cut summaries only include staff marked as payroll-eligible. Owner and admin default to excluded, but you can still opt them in here.
                </p>
              </div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isPayrollEligible"
                  checked={values.isPayrollEligible}
                  onChange={(event) => {
                    setPayrollEligibilityTouched(true);
                    updateFormValue("isPayrollEligible", event.target.checked);
                  }}
                  className="mt-0.5 size-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                />
                <span className="text-sm font-medium text-foreground">
                  {values.isPayrollEligible ? "Included" : "Excluded"}
                </span>
              </label>
            </div>
            <FieldError errors={state.fieldErrors} name="isPayrollEligible" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactNumber" optional>Contact number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={values.contactNumber}
                className={fieldControlClassName(state.fieldErrors, "contactNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "contactNumber",
                  required: false,
                  errorId: fieldErrorId("contactNumber"),
                })}
                onChange={(event) => updateFormValue("contactNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="contactNumber" id={fieldErrorId("contactNumber")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactNumber" optional>Emergency contact number</Label>
              <Input
                id="emergencyContactNumber"
                name="emergencyContactNumber"
                value={values.emergencyContactNumber}
                className={fieldControlClassName(state.fieldErrors, "emergencyContactNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "emergencyContactNumber",
                  required: false,
                  errorId: fieldErrorId("emergencyContactNumber"),
                })}
                onChange={(event) => updateFormValue("emergencyContactNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="emergencyContactNumber" id={fieldErrorId("emergencyContactNumber")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" optional>Address</Label>
            <Textarea
              id="address"
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

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sssNumber" optional>SSS number</Label>
              <Input
                id="sssNumber"
                name="sssNumber"
                value={values.sssNumber}
                className={fieldControlClassName(state.fieldErrors, "sssNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "sssNumber",
                  required: false,
                  errorId: fieldErrorId("sssNumber"),
                })}
                onChange={(event) => updateFormValue("sssNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="sssNumber" id={fieldErrorId("sssNumber")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="philhealthNumber" optional>PhilHealth number</Label>
              <Input
                id="philhealthNumber"
                name="philhealthNumber"
                value={values.philhealthNumber}
                className={fieldControlClassName(state.fieldErrors, "philhealthNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "philhealthNumber",
                  required: false,
                  errorId: fieldErrorId("philhealthNumber"),
                })}
                onChange={(event) => updateFormValue("philhealthNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="philhealthNumber" id={fieldErrorId("philhealthNumber")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tinNumber" optional>TIN</Label>
              <Input
                id="tinNumber"
                name="tinNumber"
                value={values.tinNumber}
                className={fieldControlClassName(state.fieldErrors, "tinNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "tinNumber",
                  required: false,
                  errorId: fieldErrorId("tinNumber"),
                })}
                onChange={(event) => updateFormValue("tinNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="tinNumber" id={fieldErrorId("tinNumber")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactName" optional>Emergency contact name</Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              value={values.emergencyContactName}
              className={fieldControlClassName(state.fieldErrors, "emergencyContactName")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "emergencyContactName",
                required: false,
                errorId: fieldErrorId("emergencyContactName"),
              })}
              onChange={(event) => updateFormValue("emergencyContactName", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="emergencyContactName" id={fieldErrorId("emergencyContactName")} />
          </div>
        </CardContent>
      </Card>

      {isMechanic ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Mechanic portal login</CardTitle>
            <CardDescription>
              {mode === "create"
                ? "A Supabase portal account is created automatically when you save a new mechanic."
                : hasLinkedPortalAccount
                  ? "This mechanic already has a linked attendance portal account."
                  : "Optionally link an existing portal account that was created manually in Supabase."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "edit" && hasLinkedPortalAccount ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portalUsername">Portal username</Label>
                  <Input
                    id="portalUsername"
                    value={values.portalUsername ?? ""}
                    readOnly
                    className="bg-muted/40 text-muted-foreground"
                  />
                </div>
                {hasLegacyPortalDomain ? (
                  <p className="text-sm text-muted-foreground">
                    Use the update action below this form to move this login to @{portalEmailDomain}.
                  </p>
                ) : null}
              </div>
            ) : null}

            {mode === "edit" && !hasLinkedPortalAccount ? (
              <div className="space-y-2">
                <Label htmlFor="linkPortalUsername" optional>
                  Link existing portal username
                </Label>
                <Input
                  id="linkPortalUsername"
                  name="linkPortalUsername"
                  value={values.linkPortalUsername}
                  placeholder={`delacruz@${portalEmailDomain}`}
                  className={fieldControlClassName(state.fieldErrors, "linkPortalUsername")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "linkPortalUsername",
                    required: false,
                    errorId: fieldErrorId("linkPortalUsername"),
                  })}
                  onChange={(event) => updateFormValue("linkPortalUsername", event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep this mechanic unlinked. Only use this when the Supabase auth
                  account already exists.
                </p>
                <FieldError
                  errors={state.fieldErrors}
                  name="linkPortalUsername"
                  id={fieldErrorId("linkPortalUsername")}
                />
              </div>
            ) : null}

            {mode === "create" ? (
              <p className="text-sm text-muted-foreground">
                Username defaults to <span className="font-medium">lastname@{portalEmailDomain}</span>{" "}
                using this tenant&apos;s business name. Duplicates are resolved automatically. The
                temporary password uses <span className="font-medium">lastname@2026</span> and is
                shown once after creation.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <FormStickyActions>
        <Button asChild variant="outline" type="button">
          <Link href="/staff">Cancel</Link>
        </Button>
        <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
          {mode === "create" ? "Create staff record" : "Save changes"}
        </SubmitButton>
      </FormStickyActions>
    </form>

    {hasLegacyPortalDomain && values.staffId ? (
      <StaffPortalLoginDomainFix
        staffId={values.staffId}
        staffName={`${values.firstName} ${values.lastName}`.trim()}
        currentUsername={values.portalUsername ?? ""}
        portalEmailDomain={portalEmailDomain}
      />
    ) : null}
    </>
  );
}
