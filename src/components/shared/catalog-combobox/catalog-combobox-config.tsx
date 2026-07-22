import type { ReactNode } from "react";

import type { LaborPickerOption } from "@/features/labor/types";
import { filterLaborPickerOptions } from "@/features/labor/picker-mappers";
import {
  filterProductPickerOptions,
  formatProductPickerStockLabel,
} from "@/features/products/picker-mappers";
import type { ProductPickerOption } from "@/features/products/types";
import { filterServicePickerOptions } from "@/features/services/picker-mappers";
import type { ServicePickerOption } from "@/features/services/picker-mappers";
import { formatCurrency } from "@/lib/currency";

export type CatalogKind = "product" | "service" | "labor";

type CatalogComboboxBaseProps = {
  id?: string;
  name?: string;
  value: string;
  onAfterSelect?: () => void;
  canCreate?: boolean;
  onCreateNew?: (searchQuery: string) => void;
  disabled?: boolean;
  className?: string;
  fallbackLabel?: string;
};

export type CatalogComboboxProps =
  | (CatalogComboboxBaseProps & {
      kind: "product";
      options: ProductPickerOption[];
      onValueChange: (option: ProductPickerOption) => void;
    })
  | (CatalogComboboxBaseProps & {
      kind: "service";
      options: ServicePickerOption[];
      onValueChange: (option: ServicePickerOption) => void;
    })
  | (CatalogComboboxBaseProps & {
      kind: "labor";
      options: LaborPickerOption[];
      onValueChange: (option: LaborPickerOption) => void;
    });

export type CatalogOption =
  | ProductPickerOption
  | ServicePickerOption
  | LaborPickerOption;

export function getCatalogKindConfig(kind: CatalogKind) {
  switch (kind) {
    case "product":
      return {
        fieldLabel: "Product",
        placeholder: "Search products by name, SKU, or barcode",
        emptyMessage: "No products found.",
        emptyCreatePrompt: "Can't find the product?",
        createLabel: "Create new product",
        createLabelWithQuery: (query: string) => `Create "${query}" as a new product`,
      };
    case "service":
      return {
        fieldLabel: "Service",
        placeholder: "Search services by name or category",
        emptyMessage: "No services found.",
        emptyCreatePrompt: "Can't find the service?",
        createLabel: "Create new service",
        createLabelWithQuery: (query: string) => `Create "${query}" as a new service`,
      };
    case "labor":
      return {
        fieldLabel: "Labor item",
        placeholder: "Search labor items by description",
        emptyMessage: "No labor items found.",
        emptyCreatePrompt: "Can't find the labor item?",
        createLabel: "Create new labor item",
        createLabelWithQuery: (query: string) => `Create "${query}" as a new labor item`,
      };
  }
}

export function filterCatalogOptions(
  kind: CatalogKind,
  options: CatalogOption[],
  query: string,
  selectedId?: string,
) {
  switch (kind) {
    case "product":
      return filterProductPickerOptions(
        options as ProductPickerOption[],
        query,
        selectedId,
      );
    case "service":
      return filterServicePickerOptions(
        options as ServicePickerOption[],
        query,
        selectedId,
      );
    case "labor":
      return filterLaborPickerOptions(
        options as LaborPickerOption[],
        query,
        selectedId,
      );
  }
}

export function getCatalogOptionLabel(kind: CatalogKind, option: CatalogOption) {
  if (kind === "product") {
    return (option as ProductPickerOption).name;
  }

  return (option as ServicePickerOption | LaborPickerOption).label;
}

export function renderCatalogOptionDetails(
  kind: CatalogKind,
  option: CatalogOption,
): ReactNode {
  switch (kind) {
    case "product": {
      const product = option as ProductPickerOption;

      return (
        <>
          <span className="text-sm font-medium text-foreground">{product.name}</span>
          <span className="text-xs text-muted-foreground">
            {product.sku ? `SKU: ${product.sku}` : "No SKU"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(product.unitPrice)} • {formatProductPickerStockLabel(product)}
          </span>
        </>
      );
    }
    case "service": {
      const service = option as ServicePickerOption;

      return (
        <>
          <span className="text-sm font-medium text-foreground">{service.label}</span>
          <span className="text-xs text-muted-foreground">
            {service.category ? `Category: ${service.category}` : "No category"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(service.unitPrice)}
          </span>
        </>
      );
    }
    case "labor": {
      const labor = option as LaborPickerOption;

      return (
        <>
          <span className="text-sm font-medium text-foreground">{labor.label}</span>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(labor.unitPrice)}
          </span>
        </>
      );
    }
  }
}
