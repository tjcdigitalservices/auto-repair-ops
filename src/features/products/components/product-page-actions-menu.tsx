"use client";

import { PageOverflowMenu } from "@/components/shared/page-header-actions";
import { SpreadsheetExportMenuItem } from "@/components/shared/spreadsheet-export-menu-item";
import { ImportProductsDialog } from "@/features/products/components/import-products-dialog";

export function ProductPageActionsMenu() {
  return (
    <PageOverflowMenu label="More product actions">
      <ImportProductsDialog triggerVariant="menu" />
      <SpreadsheetExportMenuItem href="/api/products/export" label="Export products" />
    </PageOverflowMenu>
  );
}
