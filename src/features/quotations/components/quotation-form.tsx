"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
  formSelectClassName,
} from "@/components/shared/form-status";
import { AddEntryButton } from "@/components/shared/add-entry-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuotationAction, reviseQuotationAction, updateQuotationAction } from "@/features/quotations/actions/quotation-actions";
import { mapInlineCreateResultToPickerOption } from "@/features/products/picker-mappers";
import { QuickCreateProductDialog } from "@/features/products/components/quick-create-product-dialog";
import { QuickCreateServiceDialog } from "@/features/services/components/quick-create-service-dialog";
import { mapInlineCreateResultToServicePickerOption } from "@/features/services/picker-mappers";
import {
  getQuotationItemTypeResetPatch,
  QuotationLineItemFields,
} from "@/features/quotations/components/quotation-line-item-fields";
import { serializeQuotationItems } from "@/features/quotations/schemas/quotation-form-schema";
import type {
  QuotationFormItem,
  QuotationFormOptions,
  QuotationFormValues,
} from "@/features/quotations/types";
import {
  calculateQuotationGrandTotal,
  calculateQuotationSubtotal,
  createQuotationItem,
  dedupeOptionsById,
} from "@/features/quotations/utils";
import {
  formatCurrencyNumber,
  formatMoneyInputValue,
  MONEY_INPUT_STEP,
} from "@/lib/currency";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function QuotationForm({
  mode,
  initialValues,
  options,
}: {
  mode: "create" | "edit" | "revise";
  initialValues: QuotationFormValues;
  options: QuotationFormOptions;
}) {
  const formAction =
    mode === "create"
      ? createQuotationAction
      : mode === "revise"
        ? reviseQuotationAction
        : updateQuotationAction;
  const [state, formActionState] = useActionState(formAction, INITIAL_FORM_ACTION_STATE);
  const isRevise = mode === "revise";
  const [customerId, setCustomerId] = useState(initialValues.customerId);
  const [vehicleId, setVehicleId] = useState(initialValues.vehicleId);
  const [status, setStatus] = useState(initialValues.status);
  const [natureOfRepair, setNatureOfRepair] = useState(initialValues.natureOfRepair);
  const [inspectionNotes, setInspectionNotes] = useState(initialValues.inspectionNotes);
  const [discount, setDiscount] = useState(initialValues.discount);
  const [tax, setTax] = useState(initialValues.tax);
  const customerOptions = dedupeOptionsById(options.customers);
  const vehicleOptions = dedupeOptionsById(options.vehicles);
  const [items, setItems] = useState<QuotationFormItem[]>(
    initialValues.items.length > 0 ? initialValues.items : [createQuotationItem()],
  );
  const [productOptions, setProductOptions] = useState(() =>
    dedupeOptionsById(options.products),
  );
  const [serviceOptions, setServiceOptions] = useState(() =>
    dedupeOptionsById(options.services),
  );
  const [creatingProductForKey, setCreatingProductForKey] = useState<string | null>(null);
  const [createProductSearchQuery, setCreateProductSearchQuery] = useState("");
  const [creatingServiceForKey, setCreatingServiceForKey] = useState<string | null>(null);
  const [createServiceSearchQuery, setCreateServiceSearchQuery] = useState("");
  const quantityInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const availableVehicles = vehicleOptions.filter((vehicle) => vehicle.customerId === customerId);
  const subtotal = calculateQuotationSubtotal(items);
  const grandTotal = calculateQuotationGrandTotal({ items, discount, tax });

  return (
    <>
    <form action={formActionState} className="space-y-6">
      {initialValues.quotationId ? (
        <input type="hidden" name="quotationId" value={initialValues.quotationId} />
      ) : null}

      {isRevise ? (
        <>
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="vehicleId" value={vehicleId} />
        </>
      ) : null}

      <input type="hidden" name="itemsJson" value={serializeQuotationItems(items)} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>
                {mode === "create"
                  ? "Quotation details"
                  : mode === "revise"
                    ? "Revise quotation"
                    : "Edit quotation"}
              </CardTitle>
              <CardDescription>
                {mode === "revise"
                  ? "Updates save to both the customer quotation and the linked job order. Discount and tax apply to the quotation document; final invoice amounts may differ."
                  : "Quotations are estimates only. They should not touch inventory until approval and later job-order usage."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormRequiredFieldsNote />
              <FormStatusMessage message={state.message} />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerId" required>
                    Customer
                  </Label>
                  <select
                    id="customerId"
                    name={isRevise ? undefined : "customerId"}
                    value={customerId}
                    disabled={isRevise}
                    onChange={(event) => {
                      const nextCustomerId = event.target.value;
                      const nextAvailableVehicles = vehicleOptions.filter(
                        (vehicle) => vehicle.customerId === nextCustomerId,
                      );

                      setCustomerId(nextCustomerId);

                      if (!nextAvailableVehicles.some((vehicle) => vehicle.id === vehicleId)) {
                        setVehicleId("");
                      }
                    }}
                    className={formSelectClassName(state.fieldErrors, "customerId")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "customerId",
                      required: true,
                      errorId: fieldErrorId("customerId"),
                    })}
                  >
                    <option value="">Select customer</option>
                    {customerOptions.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.label}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.fieldErrors} name="customerId" id={fieldErrorId("customerId")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleId" required>
                    Vehicle
                  </Label>
                  <select
                    id="vehicleId"
                    name={isRevise ? undefined : "vehicleId"}
                    value={vehicleId}
                    disabled={isRevise}
                    onChange={(event) => setVehicleId(event.target.value)}
                    className={formSelectClassName(state.fieldErrors, "vehicleId")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "vehicleId",
                      required: true,
                      errorId: fieldErrorId("vehicleId"),
                    })}
                  >
                    <option value="">Select vehicle</option>
                    {availableVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.label}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.fieldErrors} name="vehicleId" id={fieldErrorId("vehicleId")} />
                </div>
              </div>

              {!isRevise ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status" required>
                      Quotation status
                    </Label>
                    <select
                      id="status"
                      name="status"
                      value={status}
                      onChange={(event) => setStatus(event.target.value as QuotationFormValues["status"])}
                      className={formSelectClassName(state.fieldErrors, "status")}
                      {...fieldAriaProps({
                        errors: state.fieldErrors,
                        name: "status",
                        required: true,
                        errorId: fieldErrorId("status"),
                      })}
                    >
                      <option value="draft">Draft</option>
                      <option value="pending_approval">Pending approval</option>
                    </select>
                    <FieldError errors={state.fieldErrors} name="status" id={fieldErrorId("status")} />
                  </div>
                </div>
              ) : null}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="natureOfRepair" optional>
                    Nature of repair
                  </Label>
                  <Textarea
                    id="natureOfRepair"
                    name="natureOfRepair"
                    value={natureOfRepair}
                    className={fieldControlClassName(state.fieldErrors, "natureOfRepair")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "natureOfRepair",
                      required: false,
                      errorId: fieldErrorId("natureOfRepair"),
                    })}
                    onChange={(event) => setNatureOfRepair(event.target.value)}
                  />
                  <FieldError errors={state.fieldErrors} name="natureOfRepair" id={fieldErrorId("natureOfRepair")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspectionNotes" optional>
                    Inspection notes
                  </Label>
                  <Textarea
                    id="inspectionNotes"
                    name="inspectionNotes"
                    value={inspectionNotes}
                    className={fieldControlClassName(state.fieldErrors, "inspectionNotes")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "inspectionNotes",
                      required: false,
                      errorId: fieldErrorId("inspectionNotes"),
                    })}
                    onChange={(event) => setInspectionNotes(event.target.value)}
                  />
                  <FieldError errors={state.fieldErrors} name="inspectionNotes" id={fieldErrorId("inspectionNotes")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Quotation items</CardTitle>
              <CardDescription>
                Search the catalog for products and services. Manual labor uses free-text entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => {
                return (
                  <div
                    key={item.key}
                    className="space-y-4 border-b border-border/60 pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Line {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setItems((current) =>
                            current.length > 1
                              ? current.filter((entry) => entry.key !== item.key)
                              : current,
                          )
                        }
                        disabled={items.length === 1}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="max-w-xs space-y-2">
                      <Label required>Item type</Label>
                      <select
                        value={item.itemType}
                        onChange={(event) =>
                          updateItem(setItems, item.key, {
                            itemType: event.target.value as QuotationFormItem["itemType"],
                            ...getQuotationItemTypeResetPatch(),
                          })
                        }
                        className={formSelectClassName(state.fieldErrors, "items")}
                        {...fieldAriaProps({
                          errors: state.fieldErrors,
                          name: "items",
                          required: true,
                          errorId: fieldErrorId("items"),
                        })}
                      >
                        <option value="product">Product</option>
                        <option value="service">Service</option>
                        <option value="labor">Manual labor</option>
                      </select>
                    </div>

                    <QuotationLineItemFields
                      item={item}
                      productOptions={productOptions}
                      serviceOptions={serviceOptions}
                      permissions={options.permissions}
                      onUpdate={(patch) => updateItem(setItems, item.key, patch)}
                      onCreateProduct={(searchQuery) => {
                        setCreateProductSearchQuery(searchQuery);
                        setCreatingProductForKey(item.key);
                      }}
                      onCreateService={(searchQuery) => {
                        setCreateServiceSearchQuery(searchQuery);
                        setCreatingServiceForKey(item.key);
                      }}
                      onAfterCatalogSelect={() => {
                        quantityInputRefs.current[item.key]?.focus();
                      }}
                      quantityInputRef={(element) => {
                        quantityInputRefs.current[item.key] = element;
                      }}
                      getFieldProps={(field) => ({
                        className: fieldControlClassName(state.fieldErrors, "items"),
                        ...fieldAriaProps({
                          errors: state.fieldErrors,
                          name: "items",
                          required: true,
                          errorId: fieldErrorId("items"),
                        }),
                      })}
                    />
                  </div>
                );
              })}

              <AddEntryButton
                className="w-full sm:w-auto"
                onClick={() => setItems((current) => [...current, createQuotationItem()])}
              >
                Add another line item
              </AddEntryButton>

              <FieldError errors={state.fieldErrors} name="items" id={fieldErrorId("items")} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Totals</CardTitle>
              <CardDescription>Totals are estimates only until work is approved and executed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discount" required>
                  Discount
                </Label>
                <Input
                  id="discount"
                  name="discount"
                  inputMode="decimal"
                  type="number"
                  step={MONEY_INPUT_STEP}
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className={fieldControlClassName(state.fieldErrors, "discount")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "discount",
                    required: true,
                    errorId: fieldErrorId("discount"),
                  })}
                />
                <FieldError errors={state.fieldErrors} name="discount" id={fieldErrorId("discount")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax" required>
                  Tax
                </Label>
                <Input
                  id="tax"
                  name="tax"
                  inputMode="decimal"
                  type="number"
                  step={MONEY_INPUT_STEP}
                  value={tax}
                  onChange={(event) => setTax(event.target.value)}
                  className={fieldControlClassName(state.fieldErrors, "tax")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "tax",
                    required: true,
                    errorId: fieldErrorId("tax"),
                  })}
                />
                <FieldError errors={state.fieldErrors} name="tax" id={fieldErrorId("tax")} />
              </div>

              <div className="rounded-[1.25rem] border border-border/70 bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between py-2">
                  <span>Subtotal</span>
                  <span>{formatCurrencyNumber(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Discount</span>
                  <span>{formatCurrencyNumber(Number(discount || 0))}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Tax</span>
                  <span>{formatCurrencyNumber(Number(tax || 0))}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-3 text-base font-semibold">
                  <span>Total estimate</span>
                  <span>{formatCurrencyNumber(grandTotal)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <SubmitButton
                  pendingLabel={
                    mode === "create" ? "Saving..." : mode === "revise" ? "Revising..." : "Updating..."
                  }
                >
                  {mode === "create"
                    ? "Save quotation"
                    : mode === "revise"
                      ? "Save revised quotation"
                      : "Save changes"}
                </SubmitButton>
                <Button asChild variant="outline" type="button">
                  <Link href={mode === "create" ? "/quotations" : `/quotations/${initialValues.quotationId}`}>
                    Cancel
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>

      {options.permissions.canCreateProducts ? (
        <QuickCreateProductDialog
          hideTrigger
          open={creatingProductForKey !== null}
          initialName={createProductSearchQuery}
          onOpenChange={(open) => {
            if (!open) {
              setCreatingProductForKey(null);
              setCreateProductSearchQuery("");
            }
          }}
          initialOptions={options.productFormOptions ?? undefined}
          onCreated={(product) => {
            const itemKey = creatingProductForKey;
            const pickerProduct = mapInlineCreateResultToPickerOption(product);

            setProductOptions((current) => dedupeOptionsById([...current, pickerProduct]));

            if (itemKey) {
              updateItem(setItems, itemKey, {
                itemType: "product",
                productId: pickerProduct.id,
                serviceId: "",
                laborTemplateId: "",
                description: pickerProduct.name,
                unitPrice: formatMoneyInputValue(pickerProduct.unitPrice),
              });
              quantityInputRefs.current[itemKey]?.focus();
            }

            setCreatingProductForKey(null);
            setCreateProductSearchQuery("");
          }}
        />
      ) : null}

      {options.permissions.canCreateServices ? (
        <QuickCreateServiceDialog
          hideTrigger
          open={creatingServiceForKey !== null}
          initialName={createServiceSearchQuery}
          onOpenChange={(open) => {
            if (!open) {
              setCreatingServiceForKey(null);
              setCreateServiceSearchQuery("");
            }
          }}
          onCreated={(service) => {
            const itemKey = creatingServiceForKey;
            const pickerService = mapInlineCreateResultToServicePickerOption(service);

            setServiceOptions((current) => dedupeOptionsById([...current, pickerService]));

            if (itemKey) {
              updateItem(setItems, itemKey, {
                itemType: "service",
                serviceId: pickerService.id,
                productId: "",
                laborTemplateId: "",
                description: pickerService.label,
                unitPrice: formatMoneyInputValue(pickerService.unitPrice),
              });
              quantityInputRefs.current[itemKey]?.focus();
            }

            setCreatingServiceForKey(null);
            setCreateServiceSearchQuery("");
          }}
        />
      ) : null}
    </>
  );
}

function updateItem(
  setItems: React.Dispatch<React.SetStateAction<QuotationFormItem[]>>,
  key: string,
  patch: Partial<QuotationFormItem>,
) {
  setItems((current) =>
    current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
  );
}
