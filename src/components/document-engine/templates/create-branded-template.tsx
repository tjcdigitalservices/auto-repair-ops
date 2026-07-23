import { DocumentFooter } from "@/components/document-engine/document-footer";
import { DocumentHeader } from "@/components/document-engine/document-header";
import type {
  DocumentTemplateContext,
  DocumentTemplateDefinition,
  DocumentTemplateName,
  DocumentPageLayout,
} from "@/components/document-engine/templates/types";
import { DEFAULT_A4_PAGE_LAYOUT } from "@/components/document-engine/templates/types";
import type { JSONContent } from "@tiptap/core";

type BrandedTemplateConfig = {
  id: DocumentTemplateName;
  label: string;
  defaultDocumentTitle: string;
  defaultContentJson: JSONContent;
  contentPlaceholder?: string;
  pageLayout?: DocumentPageLayout;
};

export function createBrandedDocumentTemplate({
  id,
  label,
  defaultDocumentTitle,
  defaultContentJson,
  contentPlaceholder,
  pageLayout = DEFAULT_A4_PAGE_LAYOUT,
}: BrandedTemplateConfig): DocumentTemplateDefinition {
  return {
    id,
    label,
    defaultDocumentTitle,
    defaultContentJson,
    contentPlaceholder,
    pageLayout,
    renderHeader: (context: DocumentTemplateContext) => (
      <DocumentHeader
        businessName={context.businessProfile.businessName}
        documentTitle={context.documentTitle}
        logoSrc={context.businessProfile.businessLogoUrl}
        compact={Boolean(context.pageIndex && context.pageIndex > 0)}
      />
    ),
    renderFooter: (context: DocumentTemplateContext) => (
      <DocumentFooter
        businessName={context.businessProfile.businessName}
        vatRegistrationNo={context.businessProfile.businessVatRegistrationNo}
        contactNumber={context.businessProfile.businessContact}
        email={context.businessProfile.businessEmail}
        address={context.businessProfile.businessAddress}
        websiteUrl={context.businessProfile.websiteUrl}
        facebookLabel={context.businessProfile.facebookLabel}
        pageNumber={context.pageIndex !== undefined ? context.pageIndex + 1 : undefined}
        pageCount={context.pageCount}
      />
    ),
  };
}
