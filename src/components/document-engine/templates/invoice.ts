import { createDefaultDocumentJson } from "@/components/document-engine/persistence/document-content";
import { createBrandedDocumentTemplate } from "@/components/document-engine/templates/create-branded-template";

export const invoiceDocumentTemplate = createBrandedDocumentTemplate({
  id: "invoice",
  label: "Invoice",
  defaultDocumentTitle: "INVOICE",
  defaultContentJson: createDefaultDocumentJson(
    "Enter invoice line items, payment terms, and any additional billing notes.",
  ),
  contentPlaceholder: "Enter invoice details…",
});
