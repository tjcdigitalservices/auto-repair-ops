import type { DocumentTemplateContext } from "@/components/document-engine/templates/types";

export function buildDocumentPageContext(
  baseContext: Omit<DocumentTemplateContext, "pageIndex" | "pageCount">,
  pageIndex: number,
  pageCount: number,
): DocumentTemplateContext {
  return {
    ...baseContext,
    pageIndex,
    pageCount,
  };
}
