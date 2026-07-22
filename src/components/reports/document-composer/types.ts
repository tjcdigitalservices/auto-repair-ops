import type { ReactNode } from "react";

import type { PrintDocumentBusinessProfile } from "@/components/reports/print-document-page";

export type DocumentBusinessProfile = PrintDocumentBusinessProfile;

export type DocumentComposerProps = {
  moduleTitle: string;
  moduleDescription?: string;
  documentTitle: string;
  onDocumentTitleChange: (value: string) => void;
  defaultDocumentTitle?: string;
  documentMeta?: string;
  businessProfile: DocumentBusinessProfile;
  initialContent?: string;
  onContentChange?: (html: string) => void;
  onPrint?: () => void;
  overflowActions?: ReactNode;
  /** @deprecated Use overflowActions instead */
  extraActions?: ReactNode;
  contentPlaceholder?: string;
  className?: string;
};
