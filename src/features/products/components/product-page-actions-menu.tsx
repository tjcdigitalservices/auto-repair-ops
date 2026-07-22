"use client";

import { PageOverflowMenu } from "@/components/shared/page-header-actions";
import { ImportProductsDialog } from "@/features/products/components/import-products-dialog";

export function ProductPageActionsMenu() {
  return (
    <PageOverflowMenu label="More product actions">
      <ImportProductsDialog triggerVariant="menu" />
    </PageOverflowMenu>
  );
}
