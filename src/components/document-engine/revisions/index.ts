export { canEditDocument, canReviseApprovedDocument } from "@/components/document-engine/revisions/guards";
export {
  buildRevisionDisplayNumber,
  formatRevisionLabel,
  formatRevisionMetadataLabel,
  stripRevisionSuffix,
} from "@/components/document-engine/revisions/labels";
export { ReviseApprovedDocumentDialog } from "@/components/document-engine/revisions/revise-approved-document-dialog";
export type { DocumentRevisionMetadata, RevisionDisplayContext } from "@/components/document-engine/revisions/types";
