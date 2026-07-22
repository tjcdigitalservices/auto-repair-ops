"use client";

import { useState } from "react";

import {
  DEFAULT_DOCUMENT_TITLE,
  DocumentComposer,
} from "@/components/reports/document-composer";

export function BlankDocumentPreviewComposer({
  businessName,
  businessLogoUrl,
  businessVatRegistrationNo,
  businessContact,
  businessEmail,
  businessAddress,
  branchName,
}: {
  businessName: string;
  businessLogoUrl: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  branchName: string;
}) {
  const [documentTitle, setDocumentTitle] = useState("");

  return (
    <DocumentComposer
      moduleTitle="Blank Document"
      moduleDescription="Compose and print A4 documents for this branch."
      documentTitle={documentTitle}
      onDocumentTitleChange={setDocumentTitle}
      defaultDocumentTitle={DEFAULT_DOCUMENT_TITLE}
      documentMeta={`Internal blank document • ${branchName}`}
      businessProfile={{
        businessName,
        businessLogoUrl,
        businessVatRegistrationNo,
        businessContact,
        businessEmail,
        businessAddress,
        websiteUrl: null,
        facebookLabel: null,
      }}
      onPrint={() => window.print()}
    />
  );
}
