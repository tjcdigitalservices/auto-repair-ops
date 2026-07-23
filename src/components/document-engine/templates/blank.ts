import { createDefaultDocumentJson } from "@/components/document-engine/persistence/document-content";
import { createBrandedDocumentTemplate } from "@/components/document-engine/templates/create-branded-template";

export const blankDocumentTemplate = createBrandedDocumentTemplate({
  id: "blank",
  label: "Blank Document",
  defaultDocumentTitle: "BLANK DOCUMENT",
  defaultContentJson: createDefaultDocumentJson(
    "This area is reserved for future document content.",
  ),
  contentPlaceholder: "Start writing your document…",
});
