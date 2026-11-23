"use client";

import Link from "next/link";

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
import {
  createCustomerAction,
  provisionCustomerPortalLoginAction,
  resetCustomerPortalPasswordAction,
  updateCustomerAction,
} from "@/features/customers/actions/customer-actions";
import { CustomerPortalLoginSuccess } from "@/features/customers/components/customer-portal-login-success";
import {
  INITIAL_CUSTOMER_ACTION_STATE,
  type CustomerFormValues,
} from "@/features/customers/types";
import { saveSandboxCustomerAction } from "@/features/sandbox/form-actions";
import { useBoundAction } from "@/features/sandbox/use-bound-action";
import { useFormValues } from "@/lib/use-form-values";

const PROVISION_FORM_ID = "customer-portal-provision";
const RESET_FORM_ID = "customer-portal-reset";

export function CustomerForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues: CustomerFormValues;
}) {
  const [state, formAction] = useBoundAction(
    mode === "create" ? createCustomerAction : updateCustomerAction,
    saveSandboxCustomerAction,
    INITIAL_CUSTOMER_ACTION_STATE,
  );
  const [provisionState, provisionAction] = useBoundAction(
    provisionCustomerPortalLoginAction,
    async () => ({
      status: "error" as const,
      message: "Customer app login is not available in sandbox mode.",
    }),
    INITIAL_CUSTOMER_ACTION_STATE,
  );
  const [resetState, resetAction] = useBoundAction(
    resetCustomerPortalPasswordAction,
    async () => ({
      status: "error" as const,
      message: "Customer app password reset is not available in sandbox mode.",
    }),
    INITIAL_CUSTOMER_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);

  const portalLogin =
    state.portalLogin ?? provisionState.portalLogin ?? resetState.portalLogin;
  const isPasswordReset = Boolean(resetState.portalLogin);

  if (portalLogin) {
    return (
      <CustomerPortalLoginSuccess
        customerId={portalLogin.customerId}
        customerName={portalLogin.customerName}
        email={portalLogin.email}
        temporaryPassword={portalLogin.temporaryPassword}
        title={isPasswordReset ? "Customer app password reset" : undefined}
        description={
          isPasswordReset
            ? `Share this new temporary password with ${portalLogin.customerName} once. It will not be shown again after you leave this page.`
            : undefined
        }
      />
    );
  }

  return (
    <>
      {mode === "edit" && !initialValues.hasLinkedPortalAccount ? (
        <form id={PROVISION_FORM_ID} action={provisionAction} className="hidden">
          <input type="hidden" name="customerId" value={initialValues.customerId} />
        </form>
      ) : null}

      {mode === "edit" && initialValues.hasLinkedPortalAccount ? (
        <form id={RESET_FORM_ID} action={resetAction} className="hidden">
          <input type="hidden" name="customerId" value={initialValues.customerId} />
        </form>
      ) : null}

      <form action={formAction} className="space-y-6">
        {initialValues.customerId ? (
          <input type="hidden" name="customerId" value={initialValues.customerId} />
        ) : null}

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{mode === "create" ? "Customer profile" : "Edit customer"}</CardTitle>
            <CardDescription>
              Keep customer records clean because every vehicle, quotation, and invoice depends on
              this data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormRequiredFieldsNote />
            <FormStatusMessage message={state.message} />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerType" required>
                  Customer type
                </Label>
                <select
                  id="customerType"
                  name="customerType"
                  value={values.customerType}
                  className={formSelectClassName(state.fieldErrors, "customerType")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "customerType",
                    required: true,
                    errorId: fieldErrorId("customerType"),
                  })}
                  onChange={(event) =>
                    updateFormValue(
                      "customerType",
                      event.target.value as CustomerFormValues["customerType"],
                    )
                  }
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="fleet">Fleet</option>
                </select>
                <FieldError
                  errors={state.fieldErrors}
                  name="customerType"
                  id={fieldErrorId("customerType")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" required>
                  Status
                </Label>
                <select
                  id="status"
                  name="status"
                  value={values.status}
                  className={formSelectClassName(state.fieldErrors, "status")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "status",
                    required: true,
                    errorId: fieldErrorId("status"),
                  })}
                  onChange={(event) =>
                    updateFormValue("status", event.target.value as CustomerFormValues["status"])
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <FieldError errors={state.fieldErrors} name="status" id={fieldErrorId("status")} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" required={values.customerType === "individual"}>
                  First name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={values.firstName}
                  className={fieldControlClassName(state.fieldErrors, "firstName")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "firstName",
                    required: values.customerType === "individual",
                    errorId: fieldErrorId("firstName"),
                  })}
                  onChange={(event) => updateFormValue("firstName", event.target.value)}
                />
                <FieldError
                  errors={state.fieldErrors}
                  name="firstName"
                  id={fieldErrorId("firstName")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" required={values.customerType === "individual"}>
                  Last name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={values.lastName}
                  className={fieldControlClassName(state.fieldErrors, "lastName")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "lastName",
                    required: values.customerType === "individual",
                    errorId: fieldErrorId("lastName"),
                  })}
                  onChange={(event) => updateFormValue("lastName", event.target.value)}
                />
                <FieldError
                  errors={state.fieldErrors}
                  name="lastName"
                  id={fieldErrorId("lastName")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" required={values.customerType !== "individual"}>
                Company or fleet name
              </Label>
              <Input
                id="companyName"
                name="companyName"
                value={values.companyName}
                className={fieldControlClassName(state.fieldErrors, "companyName")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "companyName",
                  required: values.customerType !== "individual",
                  errorId: fieldErrorId("companyName"),
                })}
                onChange={(event) => updateFormValue("companyName", event.target.value)}
              />
              <FieldError
                errors={state.fieldErrors}
                name="companyName"
                id={fieldErrorId("companyName")}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactNumber" optional>
                  Contact number
                </Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  value={values.contactNumber}
                  onChange={(event) => updateFormValue("contactNumber", event.target.value)}
                />
                <FieldError errors={state.fieldErrors} name="contactNumber" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" optional={!values.createPortalLogin}>
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  className={fieldControlClassName(state.fieldErrors, "email")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "email",
                    required: values.createPortalLogin,
                    errorId: fieldErrorId("email"),
                  })}
                  onChange={(event) => updateFormValue("email", event.target.value)}
                />
                <FieldError errors={state.fieldErrors} name="email" id={fieldErrorId("email")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" optional>
                Address
              </Label>
              <Textarea
                id="address"
                name="address"
                value={values.address}
                onChange={(event) => updateFormValue("address", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="address" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" optional>
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={values.notes}
                onChange={(event) => updateFormValue("notes", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="notes" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Customer app login</CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Optionally create a mobile app login now. Credentials are shown once after save."
                : "Create or review the mobile app login for this customer."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "create" ? (
              <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/10 px-4 py-3">
                <input
                  type="checkbox"
                  name="createPortalLogin"
                  checked={values.createPortalLogin}
                  className="mt-1"
                  onChange={(event) => updateFormValue("createPortalLogin", event.target.checked)}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-foreground">
                    Create customer app login
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Requires email. Temporary password uses{" "}
                    <span className="font-medium">lastname@year</span> (or company name for
                    company/fleet).
                  </span>
                </span>
              </label>
            ) : null}

            {mode === "edit" && initialValues.hasLinkedPortalAccount ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="portalLoginEmail">Login email</Label>
                  <Input
                    id="portalLoginEmail"
                    value={initialValues.portalLoginEmail ?? initialValues.email}
                    readOnly
                    className="bg-muted/40 text-muted-foreground"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This customer can already sign in on the mobile app. If they forgot their
                  password, reset it here to generate a new temporary password (
                  <span className="font-medium">lastname@year</span>). It is shown once.
                </p>
                <FormStatusMessage message={resetState.message} />
                <Button type="submit" form={RESET_FORM_ID} variant="outline">
                  Reset app password
                </Button>
              </div>
            ) : null}

            {mode === "edit" && !initialValues.hasLinkedPortalAccount ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No mobile app login yet. Save the customer email above if needed, then create a
                  login. The temporary password is shown once.
                </p>
                <FormStatusMessage message={provisionState.message} />
                <Button type="submit" form={PROVISION_FORM_ID} variant="outline">
                  Create customer app login
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <FormStickyActions>
          <Button asChild variant="outline" type="button">
            <Link
              href={mode === "create" ? "/customers" : `/customers/${initialValues.customerId}`}
            >
              Cancel
            </Link>
          </Button>
          <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
            {mode === "create" ? "Create customer" : "Save changes"}
          </SubmitButton>
        </FormStickyActions>
      </form>
    </>
  );
}
