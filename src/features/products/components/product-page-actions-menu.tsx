"use client";

import { useState } from "react";

import { PageOverflowMenu } from "@/components/shared/page-header-actions";
import { SpreadsheetExportMenuItem } from "@/components/shared/spreadsheet-export-menu-item";
import {
  ImportProductsDialog,
  ImportProductsMenuItem,
} from "@/features/products/components/import-products-dialog";
import { useSandboxOptional } from "@/features/sandbox/use-bound-action";

export function ProductPageActionsMenu() {
  const sandbox = useSandboxOptional();
  const [importOpen, setImportOpen] = useState(false);

  if (sandbox) {
    return null;
  }

  return (
    <>
      <PageOverflowMenu label="More product actions">
        <ImportProductsMenuItem
          onSelect={() => {
            // Open after the overflow menu unmounts so the dialog is not torn down with it.
            window.setTimeout(() => setImportOpen(true), 0);
          }}
        />
        <SpreadsheetExportMenuItem href="/api/products/export" label="Export products" />
      </PageOverflowMenu>
      <ImportProductsDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
