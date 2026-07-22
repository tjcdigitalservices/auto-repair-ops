"use client";

import { useState } from "react";

import {
  DEFAULT_DOCUMENT_BODY_HTML,
  DEFAULT_DOCUMENT_TITLE,
  type PreviewZoomMode,
} from "@/components/reports/blank-document/constants";
import { DocumentActionToolbar } from "@/components/reports/blank-document/document-action-toolbar";
import { DocumentPreview } from "@/components/reports/blank-document/document-preview";
import { RichTextEditor } from "@/components/reports/blank-document/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [bodyHtml, setBodyHtml] = useState(DEFAULT_DOCUMENT_BODY_HTML);
  const [previewZoom, setPreviewZoom] = useState<PreviewZoomMode>("fit");

  const resolvedDocumentTitle = documentTitle.trim() || DEFAULT_DOCUMENT_TITLE;
  const documentMeta = `Internal blank document preview • ${branchName}`;

  return (
    <div className="blank-document-workspace flex h-[calc(100dvh-5.5rem)] flex-col">
      <header className="mb-3 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Blank Document</h1>
        <p className="text-sm text-muted-foreground">
          Compose and preview an A4 document for {branchName}.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-background lg:flex-row">
        <aside className="no-print flex w-full shrink-0 flex-col border-b border-border/70 lg:w-[35%] lg:border-b-0 lg:border-r">
          <DocumentActionToolbar onPrint={() => window.print()} />

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="blank-document-title"
                className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                Document Title
              </Label>
              <Input
                id="blank-document-title"
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                placeholder={DEFAULT_DOCUMENT_TITLE}
                className="h-10 border-border/80 bg-background text-base font-medium"
              />
            </div>

            <RichTextEditor content={bodyHtml} onChange={setBodyHtml} />
          </div>
        </aside>

        <DocumentPreview
          documentTitle={resolvedDocumentTitle}
          documentMeta={documentMeta}
          bodyHtml={bodyHtml}
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
          businessVatRegistrationNo={businessVatRegistrationNo}
          businessContact={businessContact}
          businessEmail={businessEmail}
          businessAddress={businessAddress}
          zoomMode={previewZoom}
          onZoomChange={setPreviewZoom}
        />
      </div>
    </div>
  );
}
