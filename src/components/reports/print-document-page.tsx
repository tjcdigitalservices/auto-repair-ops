import type { ReactNode } from "react";

import { DocumentFooter } from "@/components/reports/document-footer";
import { DocumentHeader } from "@/components/reports/document-header";
import {
  PrintPage,
  type PrintPageLayoutMode,
} from "@/components/reports/print-document-layout";
import type { PrintBusinessProfile } from "@/lib/branding/print-business-profile";

export type PrintDocumentBusinessProfile = PrintBusinessProfile;

export function PrintDocumentPage({
  businessProfile,
  documentTitle,
  documentMeta,
  compactHeader = false,
  children,
  className,
  innerClassName,
  bodyClassName,
  horizontalPaddingClassName,
  topPaddingClassName,
  bottomPaddingClassName,
  layoutMode,
}: {
  businessProfile: PrintDocumentBusinessProfile;
  documentTitle: string;
  documentMeta?: string | null;
  compactHeader?: boolean;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  bodyClassName?: string;
  horizontalPaddingClassName?: string;
  topPaddingClassName?: string;
  bottomPaddingClassName?: string;
  layoutMode?: PrintPageLayoutMode;
}) {
  return (
    <PrintPage
      className={className}
      innerClassName={innerClassName}
      bodyClassName={bodyClassName}
      horizontalPaddingClassName={horizontalPaddingClassName}
      topPaddingClassName={topPaddingClassName}
      bottomPaddingClassName={bottomPaddingClassName}
      layoutMode={layoutMode}
      header={
        <DocumentHeader
          businessName={businessProfile.businessName}
          documentTitle={documentTitle}
          documentMeta={documentMeta}
          logoSrc={businessProfile.businessLogoUrl}
          compact={compactHeader}
        />
      }
      footer={
        <DocumentFooter
          businessName={businessProfile.businessName}
          vatRegistrationNo={businessProfile.businessVatRegistrationNo}
          contactNumber={businessProfile.businessContact}
          email={businessProfile.businessEmail}
          address={businessProfile.businessAddress}
          websiteUrl={businessProfile.websiteUrl}
          facebookLabel={businessProfile.facebookLabel}
        />
      }
    >
      {children}
    </PrintPage>
  );
}
