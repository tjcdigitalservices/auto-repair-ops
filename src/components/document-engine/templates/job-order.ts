import { createDefaultDocumentJson } from "@/components/document-engine/persistence/document-content";
import { createBrandedDocumentTemplate } from "@/components/document-engine/templates/create-branded-template";

export const jobOrderDocumentTemplate = createBrandedDocumentTemplate({
  id: "job-order",
  label: "Job Order",
  defaultDocumentTitle: "JOB ORDER",
  defaultContentJson: createDefaultDocumentJson(
    "Describe the approved work scope, services, and parts for this job order.",
  ),
  contentPlaceholder: "Enter job order details…",
  pageLayout: {
    horizontalPaddingClassName: "px-[8mm]",
    topPaddingClassName: "pt-[7mm]",
    bottomPaddingClassName: "pb-[6mm]",
    bodyClassName: "document-page-body job-order-print-body pb-[5mm]",
  },
});
