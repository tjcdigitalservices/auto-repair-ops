"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import {
  LineItemCatalogFields,
  type CatalogLineItemValue,
} from "@/components/shared/line-item-catalog-fields";
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
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { JobOrderDetailTab, JobOrderItemType } from "@/features/job-orders/types";
import { addJobOrderItemAction } from "@/features/job-orders/actions/job-order-actions";
import { addSandboxJobOrderItemAction } from "@/features/sandbox/form-actions";
import { readSandboxShop } from "@/features/sandbox/store";
import { useBoundAction } from "@/features/sandbox/use-bound-action";
import { mapInlineCreateResultToPickerOption } from "@/features/products/picker-mappers";
import { QuickCreateProductDialog } from "@/features/products/components/quick-create-product-dialog";
import { QuickCreateServiceDialog } from "@/features/services/components/quick-create-service-dialog";
import { mapInlineCreateResultToServicePickerOption } from "@/features/services/picker-mappers";
import type { ProductPickerOption } from "@/features/products/types";
import type { ServicePickerOption } from "@/features/services/picker-mappers";
import { dedupeOptionsById } from "@/features/quotations/utils";
import { formatMoneyInputValue } from "@/lib/currency";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

type CatalogOptions = {
  products: ProductPickerOption[];
  services: ServicePickerOption[];
  permissions: {
    canCreateProducts: boolean;
    canCreateServices: boolean;
  };
};

const INITIAL_LINE_ITEM: CatalogLineItemValue = {
  itemType: "product",
  productId: "",
  serviceId: "",
  description: "",
  quantity: "1",
  unitPrice: "",
};

export function JobOrderAdditionalItemForm({
  jobOrderId,
  redirectTab,
  closeDialog,
}: {
  jobOrderId: string;
  redirectTab: JobOrderDetailTab;
  closeDialog: () => void;
}) {
  const [state, formAction] = useBoundAction(
    addJobOrderItemAction,
    addSandboxJobOrderItemAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [catalogState, setCatalogState] = useState<
    | { status: "loading"; options: null; error: null }
    | { status: "ready"; options: CatalogOptions; error: null }
    | { status: "error"; options: null; error: string }
  >({
    status: "loading",
    options: null,
    error: null,
  });
  const [itemType, setItemType] = useState<JobOrderItemType | "">("");
  const [lineItem, setLineItem] = useState<CatalogLineItemValue>(INITIAL_LINE_ITEM);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createProductSearchQuery, setCreateProductSearchQuery] = useState("");
  const [creatingService, setCreatingService] = useState(false);
  const [createServiceSearchQuery, setCreateServiceSearchQuery] = useState("");
  const quantityInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function loadCatalogOptions() {
      const snapshot = readSandboxShop();
      if (snapshot) {
        if (isMounted) {
          setCatalogState({
            status: "ready",
            options: {
              products: snapshot.products
                .filter((product) => product.status === "active")
                .map((product) => ({
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  barcode: product.barcode,
                  oemNumber: null,
                  unitLabel: product.unitLabel,
                  unitPrice: product.sellingPrice,
                  availableQuantity: product.availableQuantity,
                  hasStockRecord: true,
                })),
              services: snapshot.services
                .filter((service) => service.status === "active")
                .map((service) => ({
                  id: service.id,
                  label: service.name,
                  category: service.category,
                  unitPrice: service.laborPrice,
                })),
              permissions: {
                canCreateProducts: true,
                canCreateServices: true,
              },
            },
            error: null,
          });
        }
        return;
      }

      try {
        const response = await fetch("/api/job-orders/item-options", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load catalog options.");
        }

        const data = (await response.json()) as CatalogOptions;

        if (isMounted) {
          setCatalogState({ status: "ready", options: data, error: null });
        }
      } catch (error) {
        if (!isMounted || controller.signal.aborted) {
          return;
        }

        setCatalogState({
          status: "error",
          options: null,
          error: error instanceof Error ? error.message : "Unable to load catalog options.",
        });
      }
    }

    loadCatalogOptions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const catalogOptions = catalogState.status === "ready" ? catalogState.options : null;

  const isFormValid = useMemo(() => {
    if (!itemType) {
      return false;
    }

    if (itemType === "product" && !lineItem.productId) {
      return false;
    }

    if (itemType === "service" && !lineItem.serviceId) {
      return false;
    }

    if (!lineItem.description.trim()) {
      return false;
    }

    const parsedQuantity = Number(lineItem.quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return false;
    }

    const parsedUnitPrice = Number(lineItem.unitPrice);
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      return false;
    }

    return true;
  }, [itemType, lineItem]);

  function updateLineItem(patch: Partial<CatalogLineItemValue>) {
    setLineItem((current) => ({ ...current, ...patch }));
  }

  function updateCatalogOptions(updater: (options: CatalogOptions) => CatalogOptions) {
    setCatalogState((current) =>
      current.status === "ready"
        ? { status: "ready", error: null, options: updater(current.options) }
        : current,
    );
  }

  return (
    <>
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="jobOrderId" value={jobOrderId} />
        <input type="hidden" name="redirectTab" value={redirectTab} />

        <FormStatusMessage message={state.message} />
        <FormRequiredFieldsNote />

        {catalogState.status === "error" ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {catalogState.error}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="itemType" required>
            Item type
          </Label>
          <NativeSelect
            id="itemType"
            name="itemType"
            value={itemType}
            className={fieldControlClassName(state.fieldErrors, "itemType")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "itemType",
              required: true,
              errorId: fieldErrorId("itemType"),
            })}
            onChange={(event) => {
              const nextType = event.target.value as JobOrderItemType | "";
              setItemType(nextType);

              if (!nextType) {
                setLineItem(INITIAL_LINE_ITEM);
                return;
              }

              setLineItem({
                ...INITIAL_LINE_ITEM,
                itemType: nextType,
              });
            }}
          >
            <option value="">Select item type</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="labor">Manual labor</option>
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="itemType" id={fieldErrorId("itemType")} />
        </div>

        {itemType && catalogOptions ? (
          <LineItemCatalogFields
            item={{ ...lineItem, itemType }}
            productOptions={catalogOptions.products}
            serviceOptions={catalogOptions.services}
            permissions={catalogOptions.permissions}
            showLineTotal={false}
            onUpdate={updateLineItem}
            onCreateProduct={(searchQuery) => {
              setCreateProductSearchQuery(searchQuery);
              setCreatingProduct(true);
            }}
            onCreateService={(searchQuery) => {
              setCreateServiceSearchQuery(searchQuery);
              setCreatingService(true);
            }}
            onAfterCatalogSelect={() => {
              quantityInputRef.current?.focus();
            }}
            quantityInputRef={(element) => {
              quantityInputRef.current = element;
            }}
            fieldNames={{
              productId: "productId",
              serviceId: "serviceId",
              description: "description",
              quantity: "quantity",
              unitPrice: "unitPrice",
            }}
            getFieldProps={(field) => ({
              className: fieldControlClassName(state.fieldErrors, field),
              ...fieldAriaProps({
                errors: state.fieldErrors,
                name: field,
                required: true,
                errorId: fieldErrorId(field),
              }),
            })}
          />
        ) : itemType && catalogState.status === "loading" ? (
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Loading catalog options...
          </div>
        ) : null}

        {itemType === "product" ? null : <input type="hidden" name="productId" value={lineItem.productId} />}
        {itemType === "service" ? null : <input type="hidden" name="serviceId" value={lineItem.serviceId} />}

        <FieldError errors={state.fieldErrors} name="productId" id={fieldErrorId("productId")} />
        <FieldError errors={state.fieldErrors} name="serviceId" id={fieldErrorId("serviceId")} />
        <FieldError errors={state.fieldErrors} name="description" id={fieldErrorId("description")} />
        <FieldError errors={state.fieldErrors} name="quantity" id={fieldErrorId("quantity")} />
        <FieldError errors={state.fieldErrors} name="unitPrice" id={fieldErrorId("unitPrice")} />

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <SubmitButton pendingLabel="Adding..." disabled={!isFormValid} variant="add">
            <Plus className="size-4" />
            Add line item
          </SubmitButton>
        </div>
      </form>

      {catalogOptions?.permissions.canCreateProducts ? (
        <QuickCreateProductDialog
          hideTrigger
          open={creatingProduct}
          initialName={createProductSearchQuery}
          onOpenChange={(open) => {
            if (!open) {
              setCreatingProduct(false);
              setCreateProductSearchQuery("");
            }
          }}
          onCreated={(product) => {
            const pickerProduct = mapInlineCreateResultToPickerOption(product);

            updateCatalogOptions((options) => ({
              ...options,
              products: dedupeOptionsById([...options.products, pickerProduct]),
            }));

            updateLineItem({
              productId: pickerProduct.id,
              serviceId: "",
              description: pickerProduct.name,
              unitPrice: formatMoneyInputValue(pickerProduct.unitPrice),
            });
            quantityInputRef.current?.focus();
            setCreatingProduct(false);
            setCreateProductSearchQuery("");
          }}
        />
      ) : null}

      {catalogOptions?.permissions.canCreateServices ? (
        <QuickCreateServiceDialog
          hideTrigger
          open={creatingService}
          initialName={createServiceSearchQuery}
          onOpenChange={(open) => {
            if (!open) {
              setCreatingService(false);
              setCreateServiceSearchQuery("");
            }
          }}
          onCreated={(service) => {
            const pickerService = mapInlineCreateResultToServicePickerOption(service);

            updateCatalogOptions((options) => ({
              ...options,
              services: dedupeOptionsById([...options.services, pickerService]),
            }));

            updateLineItem({
              serviceId: pickerService.id,
              productId: "",
              description: pickerService.label,
              unitPrice: formatMoneyInputValue(pickerService.unitPrice),
            });
            quantityInputRef.current?.focus();
            setCreatingService(false);
            setCreateServiceSearchQuery("");
          }}
        />
      ) : null}
    </>
  );
}
