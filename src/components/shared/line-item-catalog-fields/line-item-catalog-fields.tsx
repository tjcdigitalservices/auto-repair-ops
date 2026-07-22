"use client";

import { CatalogCombobox, getCatalogKindConfig } from "@/components/shared/catalog-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductPickerOption } from "@/features/products/types";
import type { ServicePickerOption } from "@/features/services/picker-mappers";
import {
  formatCurrencyNumber,
  formatMoneyInputValue,
  MONEY_INPUT_STEP,
  roundCurrency,
} from "@/lib/currency";
import { cn } from "@/lib/utils";

export type CatalogLineItemType = "product" | "service" | "labor";

export type CatalogLineItemValue = {
  itemType: CatalogLineItemType;
  productId: string;
  serviceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type FieldControlProps = {
  className?: string;
} & Record<string, unknown>;

type LineItemCatalogFieldsProps = {
  item: CatalogLineItemValue;
  productOptions: ProductPickerOption[];
  serviceOptions: ServicePickerOption[];
  permissions: {
    canCreateProducts: boolean;
    canCreateServices: boolean;
  };
  onUpdate: (patch: Partial<CatalogLineItemValue>) => void;
  onCreateProduct: (searchQuery: string) => void;
  onCreateService: (searchQuery: string) => void;
  onAfterCatalogSelect?: () => void;
  quantityInputRef?: (element: HTMLInputElement | null) => void;
  inputClassName?: string;
  showLineTotal?: boolean;
  fieldNames?: {
    productId?: string;
    serviceId?: string;
    description?: string;
    quantity?: string;
    unitPrice?: string;
  };
  getFieldProps?: (
    field: "quantity" | "unitPrice" | "description" | "items",
  ) => FieldControlProps;
};

export function LineItemCatalogFields({
  item,
  productOptions,
  serviceOptions,
  permissions,
  onUpdate,
  onCreateProduct,
  onCreateService,
  onAfterCatalogSelect,
  quantityInputRef,
  inputClassName = "rounded-xl",
  showLineTotal = true,
  fieldNames,
  getFieldProps,
}: LineItemCatalogFieldsProps) {
  const lineTotal = calculateCatalogLineTotal(item);
  const isManualLabor = item.itemType === "labor";
  const catalogConfig = isManualLabor ? null : getCatalogKindConfig(item.itemType);
  const quantityProps = getFieldProps?.("quantity") ?? {};
  const unitPriceProps = getFieldProps?.("unitPrice") ?? {};
  const descriptionProps = getFieldProps?.("description") ?? {};

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          {isManualLabor ? (
            <>
              <Label required>Labor Description</Label>
              <Input
                id={fieldNames?.description}
                name={fieldNames?.description}
                value={item.description}
                className={cn(inputClassName, descriptionProps.className)}
                placeholder="Describe the labor performed..."
                onChange={(event) => onUpdate({ description: event.target.value })}
                {...descriptionProps}
              />
            </>
          ) : (
            <>
              <Label required>{catalogConfig?.fieldLabel}</Label>
              {item.itemType === "product" ? (
                <CatalogCombobox
                  kind="product"
                  id={fieldNames?.productId}
                  name={fieldNames?.productId}
                  options={productOptions}
                  value={item.productId}
                  canCreate={permissions.canCreateProducts}
                  onCreateNew={onCreateProduct}
                  onValueChange={(product) => {
                    onUpdate({
                      productId: product.id,
                      serviceId: "",
                      description: product.name,
                      unitPrice: formatMoneyInputValue(product.unitPrice),
                    });
                  }}
                  onAfterSelect={onAfterCatalogSelect}
                />
              ) : null}
              {item.itemType === "service" ? (
                <CatalogCombobox
                  kind="service"
                  id={fieldNames?.serviceId}
                  name={fieldNames?.serviceId}
                  options={serviceOptions}
                  value={item.serviceId}
                  canCreate={permissions.canCreateServices}
                  onCreateNew={onCreateService}
                  onValueChange={(service) => {
                    onUpdate({
                      serviceId: service.id,
                      productId: "",
                      description: service.label,
                      unitPrice: formatMoneyInputValue(service.unitPrice),
                    });
                  }}
                  onAfterSelect={onAfterCatalogSelect}
                />
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label required>Quantity</Label>
          <Input
            ref={quantityInputRef}
            id={fieldNames?.quantity}
            name={fieldNames?.quantity}
            inputMode="decimal"
            value={item.quantity}
            className={cn(inputClassName, quantityProps.className)}
            onChange={(event) => onUpdate({ quantity: event.target.value })}
            {...quantityProps}
          />
        </div>

        <div className="space-y-2">
          <Label required>Unit price</Label>
          <Input
            id={fieldNames?.unitPrice}
            name={fieldNames?.unitPrice}
            inputMode="decimal"
            type="number"
            step={MONEY_INPUT_STEP}
            value={item.unitPrice}
            className={cn(inputClassName, unitPriceProps.className)}
            onChange={(event) => onUpdate({ unitPrice: event.target.value })}
            {...unitPriceProps}
          />
        </div>
      </div>

      {!isManualLabor ? (
        <div className="space-y-2">
          <Label required>Description</Label>
          <Input
            id={fieldNames?.description}
            name={fieldNames?.description}
            value={item.description}
            className={cn(inputClassName, descriptionProps.className)}
            onChange={(event) => onUpdate({ description: event.target.value })}
            {...descriptionProps}
          />
        </div>
      ) : null}

      {showLineTotal ? (
        <div className="space-y-2">
          <Label>Line total</Label>
          <div className="flex h-10 items-center rounded-xl border border-border/70 bg-muted/20 px-3 text-sm font-medium text-foreground">
            {formatCurrencyNumber(lineTotal)}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function getCatalogLineItemTypeResetPatch(): Partial<CatalogLineItemValue> {
  return {
    productId: "",
    serviceId: "",
    description: "",
    unitPrice: formatMoneyInputValue(0),
  };
}

function calculateCatalogLineTotal(item: Pick<CatalogLineItemValue, "quantity" | "unitPrice">) {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);

  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
    return 0;
  }

  return roundCurrency(quantity * unitPrice);
}
