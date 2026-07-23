"use client";

import { formatTime } from "@/lib/format-time";
import type { DocumentSaveStatus } from "@/components/document-engine/persistence/types";
import { cn } from "@/lib/utils";

export function DocumentSaveStatusBadge({
  status,
  className,
}: {
  status: DocumentSaveStatus;
  className?: string;
}) {
  const label = getSaveStatusLabel(status);

  if (!label) {
    return null;
  }

  return (
    <p
      className={cn(
        "text-xs text-muted-foreground",
        status.state === "error" && "text-destructive",
        className,
      )}
      aria-live="polite"
    >
      {label}
    </p>
  );
}

function getSaveStatusLabel(status: DocumentSaveStatus) {
  switch (status.state) {
    case "idle":
      return null;
    case "saving":
      return "Saving…";
    case "saved":
      return `Last saved ${formatTime(status.savedAt)}`;
    case "error":
      return status.message;
    default:
      return null;
  }
}
