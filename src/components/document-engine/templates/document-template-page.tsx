import type { ReactNode } from "react";

import { DocumentPage } from "@/components/document-engine/document-page";
import type {
  DocumentTemplateContext,
  DocumentTemplateDefinition,
} from "@/components/document-engine/templates/types";

/**
 * Renders a document page from a template definition.
 * Header and footer come from the template; body content is passed as children.
 */
export function DocumentTemplatePage({
  template,
  context,
  children,
  className,
}: {
  template: DocumentTemplateDefinition;
  context: DocumentTemplateContext;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DocumentPage
      className={className}
      layout={template.pageLayout}
      header={template.renderHeader(context)}
      footer={template.renderFooter(context)}
    >
      {children}
    </DocumentPage>
  );
}
