import { createDefaultDocumentJson } from "@/components/document-engine/persistence/document-content";
import { createBrandedDocumentTemplate } from "@/components/document-engine/templates/create-branded-template";

export const receiptDocumentTemplate = createBrandedDocumentTemplate({
  id: "receipt",
  label: "Receipt",
  defaultDocumentTitle: "PAYMENT RECEIPT",
  defaultContentJson: createDefaultDocumentJson(
    "Record payment details, reference numbers, and any receipt notes.",
  ),
  contentPlaceholder: "Enter receipt details…",
});
