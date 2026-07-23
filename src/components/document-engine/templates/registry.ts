import { blankDocumentTemplate } from "@/components/document-engine/templates/blank";
import { invoiceDocumentTemplate } from "@/components/document-engine/templates/invoice";
import { jobOrderDocumentTemplate } from "@/components/document-engine/templates/job-order";
import { quotationDocumentTemplate } from "@/components/document-engine/templates/quotation";
import { receiptDocumentTemplate } from "@/components/document-engine/templates/receipt";
import type {
  DocumentTemplateDefinition,
  DocumentTemplateName,
} from "@/components/document-engine/templates/types";

const DOCUMENT_TEMPLATES: Record<DocumentTemplateName, DocumentTemplateDefinition> = {
  blank: blankDocumentTemplate,
  quotation: quotationDocumentTemplate,
  invoice: invoiceDocumentTemplate,
  "job-order": jobOrderDocumentTemplate,
  receipt: receiptDocumentTemplate,
};

export function isDocumentTemplateName(value: string): value is DocumentTemplateName {
  return value in DOCUMENT_TEMPLATES;
}

export function getDocumentTemplate(template: DocumentTemplateName): DocumentTemplateDefinition {
  return DOCUMENT_TEMPLATES[template];
}

export function listDocumentTemplates(): DocumentTemplateDefinition[] {
  return Object.values(DOCUMENT_TEMPLATES);
}

export { DOCUMENT_TEMPLATES };
