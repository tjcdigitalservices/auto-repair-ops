import { createDefaultDocumentJson } from "@/components/document-engine/persistence/document-content";
import { createBrandedDocumentTemplate } from "@/components/document-engine/templates/create-branded-template";

export const quotationDocumentTemplate = createBrandedDocumentTemplate({
  id: "quotation",
  label: "Quotation",
  defaultDocumentTitle: "QUOTATION",
  defaultContentJson: createDefaultDocumentJson(
    "Describe the requested work, parts, and labor for this quotation.",
  ),
  contentPlaceholder: "Enter quotation details…",
});
