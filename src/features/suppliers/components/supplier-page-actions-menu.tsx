"use client";

import { PageOverflowMenu } from "@/components/shared/page-header-actions";
import { SpreadsheetExportMenuItem } from "@/components/shared/spreadsheet-export-menu-item";
import { ImportSuppliersDialog } from "@/features/suppliers/components/import-suppliers-dialog";

export function SupplierPageActionsMenu() {
  return (
    <PageOverflowMenu label="More supplier actions">
      <ImportSuppliersDialog triggerVariant="menu" />
      <SpreadsheetExportMenuItem href="/api/suppliers/export" label="Export suppliers" />
    </PageOverflowMenu>
  );
}
