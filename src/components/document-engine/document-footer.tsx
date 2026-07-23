import { DocumentFooter as ReportDocumentFooter } from "@/components/reports/document-footer";
import type { DocumentFooterProps } from "@/components/document-engine/types";

export function DocumentFooter({
  businessName,
  vatRegistrationNo,
  contactNumber,
  email,
  address,
  websiteUrl,
  facebookLabel,
  pageNumber,
  pageCount,
}: DocumentFooterProps) {
  return (
    <div className="space-y-1">
      <ReportDocumentFooter
        businessName={businessName}
        vatRegistrationNo={vatRegistrationNo}
        contactNumber={contactNumber}
        email={email}
        address={address}
        websiteUrl={websiteUrl}
        facebookLabel={facebookLabel}
      />
      {pageNumber && pageCount ? (
        <p className="text-right text-[9px] font-medium tracking-[0.08em] text-slate-500">
          Page {pageNumber} of {pageCount}
        </p>
      ) : null}
    </div>
  );
}
