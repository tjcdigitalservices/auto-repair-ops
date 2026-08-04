"use client";

import type { DocumentSaveStatus } from "@/components/document-engine/persistence/types";
import { DocumentSaveStatusBadge } from "@/components/document-engine/document-save-status";

function MetadataSeparator() {
  return <span aria-hidden="true">·</span>;
}

export function DocumentComposerHeaderDescription({
  moduleDescription,
  saveStatus,
  revisionMetadataLabel,
}: {
  moduleDescription?: React.ReactNode;
  saveStatus?: DocumentSaveStatus;
  revisionMetadataLabel?: string;
}) {
  const saveStatusLabel = saveStatus ? (
    <DocumentSaveStatusBadge status={saveStatus} className="inline text-sm" />
  ) : null;
  const hasSaveStatus = saveStatus && saveStatus.state !== "idle";

  if (!moduleDescription && !hasSaveStatus && !revisionMetadataLabel) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      {moduleDescription ? <span>{moduleDescription}</span> : null}
      {moduleDescription && hasSaveStatus ? <MetadataSeparator /> : null}
      {hasSaveStatus ? saveStatusLabel : null}
      {(moduleDescription || hasSaveStatus) && revisionMetadataLabel ? <MetadataSeparator /> : null}
      {revisionMetadataLabel ? <span>{revisionMetadataLabel}</span> : null}
    </div>
  );
}
