import type { ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";

import type { DocumentBusinessProfile } from "@/components/document-engine/types";

export type DocumentTemplateName =
  | "blank"
  | "quotation"
  | "invoice"
  | "job-order"
  | "receipt";

export type DocumentPageLayout = {
  horizontalPaddingClassName?: string;
  topPaddingClassName?: string;
  bottomPaddingClassName?: string;
  bodyClassName?: string;
};

export type DocumentTemplateContext = {
  businessProfile: DocumentBusinessProfile;
  documentTitle: string;
  /** @deprecated Printable headers no longer render application metadata subtitles. */
  documentMeta?: string;
  pageIndex?: number;
  pageCount?: number;
};

export type DocumentTemplateDefinition = {
  id: DocumentTemplateName;
  label: string;
  defaultDocumentTitle: string;
  defaultContentJson: JSONContent;
  contentPlaceholder?: string;
  pageLayout: DocumentPageLayout;
  renderHeader: (context: DocumentTemplateContext) => ReactNode;
  renderFooter: (context: DocumentTemplateContext) => ReactNode;
};

export const DEFAULT_A4_PAGE_LAYOUT: DocumentPageLayout = {
  horizontalPaddingClassName: "px-[8mm]",
  topPaddingClassName: "pt-[8mm]",
  bottomPaddingClassName: "pb-[8mm]",
  bodyClassName: "document-page-body pb-0",
};
