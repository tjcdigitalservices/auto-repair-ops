"use client";

import { CatalogCombobox, getCatalogKindConfig } from "@/components/shared/catalog-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
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
  layout?: "default" | "card";
  lineNumber?: number;
  canRemove?: boolean;
  onRemove?: () => void;
  onItemTypeChange?: (itemType: CatalogLineItemType) => void;
  itemTypeSelectClassName?: string;
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
  layout = "default",
  lineNumber,
  canRemove = false,
  onRemove,
  onItemTypeChange,
  itemTypeSelectClassName,
  fieldNames,
  getFieldProps,
}: LineItemCatalogFieldsProps) {
  if (layout === "card") {
    return (
      <QuotationLineItemCard
        item={item}
        productOptions={productOptions}
        serviceOptions={serviceOptions}
        permissions={permissions}
        onUpdate={onUpdate}
        onCreateProduct={onCreateProduct}
        onCreateService={onCreateService}
        onAfterCatalogSelect={onAfterCatalogSelect}
        quantityInputRef={quantityInputRef}
        inputClassName={inputClassName}
        showLineTotal={showLineTotal}
        lineNumber={lineNumber ?? 1}
        canRemove={canRemove}
        onRemove={onRemove}
        onItemTypeChange={onItemTypeChange}
        itemTypeSelectClassName={itemTypeSelectClassName}
        fieldNames={fieldNames}
        getFieldProps={getFieldProps}
      />
    );
  }

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

function QuotationLineItemCard({
  item,
  productOptions,
  serviceOptions,
  permissions,
  onUpdate,
  onCreateProduct,
  onCreateService,
  onAfterCatalogSelect,
  quantityInputRef,
  inputClassName,
  showLineTotal,
  lineNumber,
  canRemove,
  onRemove,
  onItemTypeChange,
  itemTypeSelectClassName,
  fieldNames,
  getFieldProps,
}: Omit<LineItemCatalogFieldsProps, "layout"> & {
  lineNumber: number;
}) {
  const lineTotal = calculateCatalogLineTotal(item);
  const isManualLabor = item.itemType === "labor";
  const catalogConfig = isManualLabor ? null : getCatalogKindConfig(item.itemType);
  const quantityProps = getFieldProps?.("quantity") ?? {};
  const unitPriceProps = getFieldProps?.("unitPrice") ?? {};
  const descriptionProps = getFieldProps?.("description") ?? {};

  return (
    <div className="rounded-2xl border border-border/50 bg-muted/10 p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Line {lineNumber}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-1 text-sm font-normal text-muted-foreground hover:text-foreground"
          disabled={!canRemove}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="space-y-2 md:col-span-2">
            <Label required>Item type</Label>
            <NativeSelect
              value={item.itemType}
              className={cn("rounded-xl", itemTypeSelectClassName)}
              onChange={(event) =>
                onItemTypeChange?.(event.target.value as CatalogLineItemType)
              }
            >
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="labor">Manual labor</option>
            </NativeSelect>
          </div>

          {isManualLabor ? (
            <div className="space-y-2 md:col-span-10">
              <Label required>Description</Label>
              <Input
                id={fieldNames?.description}
                name={fieldNames?.description}
                value={item.description}
                className={cn(inputClassName, descriptionProps.className)}
                placeholder="Describe the labor performed..."
                onChange={(event) => onUpdate({ description: event.target.value })}
                {...descriptionProps}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2 md:col-span-5">
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
              </div>

              <div className="space-y-2 md:col-span-5">
                <Label optional>Description</Label>
                <Input
                  id={fieldNames?.description}
                  name={fieldNames?.description}
                  value={item.description}
                  className={cn(inputClassName, descriptionProps.className)}
                  placeholder="Optional override"
                  onChange={(event) => onUpdate({ description: event.target.value })}
                  {...descriptionProps}
                />
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="space-y-2 md:col-span-2">
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

          <div className="space-y-2 md:col-span-5">
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

          {showLineTotal ? (
            <div className="space-y-2 md:col-span-5">
              <Label>Line total</Label>
              <div className="flex h-10 items-center rounded-xl border border-border/50 bg-background px-3 text-sm font-medium text-foreground">
                {formatCurrencyNumber(lineTotal)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
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
