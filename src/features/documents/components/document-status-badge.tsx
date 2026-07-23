import { StatusBadge } from "@/components/shared/status-badge";
import type { DocumentStatus } from "@/components/document-engine/persistence/types";

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const STATUS_TONES: Record<DocumentStatus, "neutral" | "success" | "warning"> = {
  draft: "neutral",
  published: "success",
  archived: "warning",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <StatusBadge tone={STATUS_TONES[status]} variant="table">
      {STATUS_LABELS[status]}
    </StatusBadge>
  );
}
