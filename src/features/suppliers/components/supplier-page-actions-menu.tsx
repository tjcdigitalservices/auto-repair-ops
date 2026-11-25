"use client";

import { useState } from "react";

import { PageOverflowMenu } from "@/components/shared/page-header-actions";
import { SpreadsheetExportMenuItem } from "@/components/shared/spreadsheet-export-menu-item";
import {
  ImportSuppliersDialog,
  ImportSuppliersMenuItem,
} from "@/features/suppliers/components/import-suppliers-dialog";
import { useSandboxOptional } from "@/features/sandbox/use-bound-action";

export function SupplierPageActionsMenu() {
  const sandbox = useSandboxOptional();
  const [importOpen, setImportOpen] = useState(false);

  if (sandbox) {
    return null;
  }

  return (
    <>
      <PageOverflowMenu label="More supplier actions">
        <ImportSuppliersMenuItem
          onSelect={() => {
            window.setTimeout(() => setImportOpen(true), 0);
          }}
        />
        <SpreadsheetExportMenuItem href="/api/suppliers/export" label="Export suppliers" />
      </PageOverflowMenu>
      <ImportSuppliersDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
