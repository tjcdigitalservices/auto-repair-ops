"use client";

import { useState } from "react";

import { PageOverflowMenu } from "@/components/shared/page-header-actions";
import { SpreadsheetExportMenuItem } from "@/components/shared/spreadsheet-export-menu-item";
import {
  ImportServicesDialog,
  ImportServicesMenuItem,
} from "@/features/services/components/import-services-dialog";
import { useSandboxOptional } from "@/features/sandbox/use-bound-action";

export function ServicePageActionsMenu() {
  const sandbox = useSandboxOptional();
  const [importOpen, setImportOpen] = useState(false);

  if (sandbox) {
    return null;
  }

  return (
    <>
      <PageOverflowMenu label="More service actions">
        <ImportServicesMenuItem
          onSelect={() => {
            window.setTimeout(() => setImportOpen(true), 0);
          }}
        />
        <SpreadsheetExportMenuItem href="/api/services/export" label="Export services" />
      </PageOverflowMenu>
      <ImportServicesDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
