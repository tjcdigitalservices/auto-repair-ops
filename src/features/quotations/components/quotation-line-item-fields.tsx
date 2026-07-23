import {
  LineItemCatalogFields,
  type CatalogLineItemType,
  type CatalogLineItemValue,
} from "@/components/shared/line-item-catalog-fields";
import type { ProductPickerOption } from "@/features/products/types";
import type { QuotationFormItem } from "@/features/quotations/types";
import type { ServicePickerOption } from "@/features/services/picker-mappers";
import { formatMoneyInputValue } from "@/lib/currency";

type FieldControlProps = {
  className?: string;
} & Record<string, unknown>;

type QuotationLineItemFieldsProps = {
  item: QuotationFormItem;
  productOptions: ProductPickerOption[];
  serviceOptions: ServicePickerOption[];
  permissions: {
    canCreateProducts: boolean;
    canCreateServices: boolean;
  };
  onUpdate: (patch: Partial<QuotationFormItem>) => void;
  onCreateProduct: (searchQuery: string) => void;
  onCreateService: (searchQuery: string) => void;
  onAfterCatalogSelect?: () => void;
  quantityInputRef?: (element: HTMLInputElement | null) => void;
  inputClassName?: string;
  layout?: "default" | "card";
  lineNumber?: number;
  canRemove?: boolean;
  onRemove?: () => void;
  onItemTypeChange?: (itemType: CatalogLineItemType) => void;
  itemTypeSelectClassName?: string;
  getFieldProps?: (
    field: "quantity" | "unitPrice" | "description" | "items",
  ) => FieldControlProps;
};

export function QuotationLineItemFields({
  item,
  onUpdate,
  ...props
}: QuotationLineItemFieldsProps) {
  return (
    <LineItemCatalogFields
      {...props}
      item={item}
      onUpdate={(patch) => {
        if (patch.productId !== undefined || patch.serviceId !== undefined) {
          onUpdate({ ...patch, laborTemplateId: "" });
          return;
        }

        onUpdate(patch);
      }}
    />
  );
}

export function getQuotationItemTypeResetPatch(): Partial<QuotationFormItem> {
  return {
    productId: "",
    serviceId: "",
    laborTemplateId: "",
    description: "",
    unitPrice: formatMoneyInputValue(0),
  };
}

export type { CatalogLineItemValue };
