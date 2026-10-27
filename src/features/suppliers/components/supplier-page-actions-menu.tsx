"use client";

import { PageOverflowMenu } from "@/components/shared/page-header-actions";
import { SpreadsheetExportMenuItem } from "@/components/shared/spreadsheet-export-menu-item";
import { ImportSuppliersDialog } from "@/features/suppliers/components/import-suppliers-dialog";
import { useSandboxOptional } from "@/features/sandbox/use-bound-action";

export function SupplierPageActionsMenu() {
  const sandbox = useSandboxOptional();

  if (sandbox) {
    return null;
  }

  return (
    <PageOverflowMenu label="More supplier actions">
      <ImportSuppliersDialog triggerVariant="menu" />
      <SpreadsheetExportMenuItem href="/api/suppliers/export" label="Export suppliers" />
    </PageOverflowMenu>
  );
}
