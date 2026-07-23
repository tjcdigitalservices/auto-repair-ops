import type { ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";

import type { PrintDocumentBusinessProfile } from "@/components/reports/print-document-page";
import type {
  DocumentTemplateName,
  DocumentPageLayout,
} from "@/components/document-engine/templates/types";
import type { DocumentRecord, DocumentSaveStatus } from "@/components/document-engine/persistence/types";

export type DocumentBusinessProfile = PrintDocumentBusinessProfile;

export type DocumentComposerProps = {
  /** Load a new document from a template. Ignored when `document` is provided. */
  template?: DocumentTemplateName;
  /** Load an existing saved document. */
  document?: DocumentRecord;
  moduleTitle: string;
  moduleDescription?: string;
  documentTitle: string;
  onDocumentTitleChange: (value: string) => void;
  titleInputRef?: React.RefObject<HTMLInputElement | null>;
  defaultDocumentTitle?: string;
  businessProfile: DocumentBusinessProfile;
  /** Override template default TipTap JSON for unsaved new documents. */
  initialContentJson?: JSONContent;
  onContentJsonChange?: (contentJson: JSONContent) => void;
  onPrint?: () => void;
  overflowActions?: ReactNode;
  /** @deprecated Use overflowActions instead */
  extraActions?: ReactNode;
  contentPlaceholder?: string;
  className?: string;
  headerActions?: ReactNode;
  saveStatus?: DocumentSaveStatus;
};

export type DocumentPageProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  className?: string;
  layout?: DocumentPageLayout;
};

export type DocumentHeaderProps = {
  businessName: string;
  documentTitle: string;
  logoSrc?: string | null;
  compact?: boolean;
};

export type DocumentFooterProps = {
  businessName: string;
  vatRegistrationNo: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  websiteUrl?: string | null;
  facebookLabel?: string | null;
  pageNumber?: number;
  pageCount?: number;
};

export type BlankDocumentPageProps = {
  businessProfile: DocumentBusinessProfile;
  documentTitle: string;
  children: ReactNode;
  className?: string;
};

export type { DocumentTemplateName, DocumentTemplateDefinition, DocumentTemplateContext, DocumentPageLayout } from "@/components/document-engine/templates/types";
export type { DocumentRecord, DocumentSaveStatus, DocumentStatus, DocumentListItem } from "@/components/document-engine/persistence/types";
