import type { DocumentStatus } from "@/components/document-engine/persistence/types";

export function canReviseApprovedDocument(status: DocumentStatus) {
  return status === "published";
}

export function canEditDocument(status: DocumentStatus) {
  return status !== "published";
}
