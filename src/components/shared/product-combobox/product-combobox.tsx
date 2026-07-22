"use client";

import { CatalogCombobox } from "@/components/shared/catalog-combobox";
import type { ProductPickerOption } from "@/features/products/types";

/** @deprecated Use CatalogCombobox with kind="product" instead. */
export function ProductCombobox(props: {
  id?: string;
  name?: string;
  products: ProductPickerOption[];
  value: string;
  onValueChange: (product: ProductPickerOption) => void;
  onAfterSelect?: () => void;
  canCreate?: boolean;
  onCreateNew?: (searchQuery: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const { products, placeholder: _placeholder, ...rest } = props;

  return <CatalogCombobox kind="product" options={products} {...rest} />;
}
