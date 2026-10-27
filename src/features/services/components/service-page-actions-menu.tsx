"use client";

import { PageOverflowMenu } from "@/components/shared/page-header-actions";
import { SpreadsheetExportMenuItem } from "@/components/shared/spreadsheet-export-menu-item";
import { ImportServicesDialog } from "@/features/services/components/import-services-dialog";
import { useSandboxOptional } from "@/features/sandbox/use-bound-action";

export function ServicePageActionsMenu() {
  const sandbox = useSandboxOptional();

  if (sandbox) {
    return null;
  }

  return (
    <PageOverflowMenu label="More service actions">
      <ImportServicesDialog triggerVariant="menu" />
      <SpreadsheetExportMenuItem href="/api/services/export" label="Export services" />
    </PageOverflowMenu>
  );
}
