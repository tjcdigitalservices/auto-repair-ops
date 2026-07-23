import type { ReactNode } from "react";

import { DocumentBody } from "@/components/document-engine/document-body";
import { DocumentTemplatePage } from "@/components/document-engine/templates/document-template-page";
import { getDocumentTemplate } from "@/components/document-engine/templates/registry";
import type { BlankDocumentPageProps } from "@/components/document-engine/types";

/**
 * @deprecated Use DocumentTemplatePage with template="blank" instead.
 */
export function BlankDocumentPage({
  businessProfile,
  documentTitle,
  children,
  className,
}: BlankDocumentPageProps) {
  return (
    <DocumentTemplatePage
      template={getDocumentTemplate("blank")}
      context={{
        businessProfile,
        documentTitle,
      }}
      className={className}
    >
      {children ?? <DocumentBody />}
    </DocumentTemplatePage>
  );
}
