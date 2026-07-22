import { DocumentFooter } from "@/components/reports/document-footer";

export function ReportFooter({
  businessName,
  vatRegistrationNo,
  contactNumber,
  email,
  address,
  websiteUrl,
  facebookLabel,
}: {
  businessName: string;
  vatRegistrationNo: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  websiteUrl?: string | null;
  facebookLabel?: string | null;
}) {
  return (
    <DocumentFooter
      businessName={businessName}
      vatRegistrationNo={vatRegistrationNo}
      contactNumber={contactNumber}
      email={email}
      address={address}
      websiteUrl={websiteUrl}
      facebookLabel={facebookLabel}
    />
  );
}
