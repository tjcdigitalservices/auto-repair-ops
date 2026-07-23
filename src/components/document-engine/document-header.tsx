import { DocumentHeader as ReportDocumentHeader } from "@/components/reports/document-header";
import type { DocumentHeaderProps } from "@/components/document-engine/types";

export function DocumentHeader({
  businessName,
  documentTitle,
  logoSrc,
  compact = false,
}: DocumentHeaderProps) {
  return (
    <ReportDocumentHeader
      businessName={businessName}
      documentTitle={documentTitle}
      logoSrc={logoSrc}
      compact={compact}
    />
  );
}
