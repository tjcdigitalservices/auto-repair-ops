import type { RevisionDisplayContext } from "@/components/document-engine/revisions/types";

export function stripRevisionSuffix(value: string) {
  return value.replace(/\s+Rev\.\d+$/, "");
}

export function buildRevisionDisplayNumber(baseNumber: string, revisionNumber: number) {
  if (revisionNumber <= 0) {
    return baseNumber;
  }

  return `${baseNumber} Rev.${revisionNumber}`;
}

export function formatRevisionLabel(revisionNumber: number) {
  if (revisionNumber <= 0) {
    return "Original Revision";
  }

  return `Revision ${revisionNumber}`;
}

export function formatRevisionMetadataLabel(context: RevisionDisplayContext) {
  const labels = [formatRevisionLabel(context.revisionNumber)];

  if (context.isCurrentRevision) {
    labels.push("Current Revision");
  }

  return labels.join(" · ");
}
