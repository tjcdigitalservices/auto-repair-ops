"use client";

import { EditorContent } from "@tiptap/react";
import { useRef } from "react";

import { useDocumentEditorContext } from "@/components/reports/document-composer/document-editor-context";
import { useDocumentBodyHeight } from "@/components/reports/document-composer/use-document-body-height";
import { usePaginatedDocumentPages } from "@/components/reports/document-composer/use-paginated-document-pages";
import { BlankPrintDocument } from "@/components/reports/blank-print-document";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import type { DocumentBusinessProfile } from "@/components/reports/document-composer/types";
import { cn } from "@/lib/utils";

/**
 * Renders one or more A4 pages. Each page repeats the template header/footer
 * and reserves the middle region for editable body content.
 */
export function DocumentPageStack({
  pages,
  className,
}: {
  pages: React.ReactNode[];
  className?: string;
}) {
  return (
    <PrintPageStack className={cn("document-page-stack", className)}>
      {pages}
    </PrintPageStack>
  );
}

function formatPageMeta(documentMeta: string | undefined, pageIndex: number, pageCount: number) {
  if (!documentMeta) {
    return pageCount > 1 ? `Page ${pageIndex + 1} of ${pageCount}` : undefined;
  }

  if (pageIndex === 0) {
    return documentMeta;
  }

  return `${documentMeta} • Page ${pageIndex + 1} of ${pageCount}`;
}

function DocumentPageBody({
  pageHtml,
  pageIndex,
  activePageIndex,
  bodyHeightPx,
  onActivate,
}: {
  pageHtml: string;
  pageIndex: number;
  activePageIndex: number;
  bodyHeightPx: number;
  onActivate: (pageIndex: number) => void;
}) {
  const editor = useDocumentEditorContext();
  const isActive = pageIndex === activePageIndex;

  return (
    <div
      className={cn(
        "document-page-body-host relative min-h-0 flex-1",
        isActive && "document-page-body-host--active",
      )}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onActivate(pageIndex);
        }
      }}
    >
      <div
        aria-hidden={isActive}
        className={cn(
          "document-page-static document-editor-content pointer-events-none absolute inset-0 overflow-hidden text-[12px] leading-[1.68] text-slate-800",
          isActive && "document-page-static--hidden-while-editing",
        )}
        dangerouslySetInnerHTML={{ __html: pageHtml }}
      />

      {isActive && editor ? (
        <div className="document-editor-overlay absolute inset-0 overflow-hidden">
          <div
            className="document-editor-overlay-shift h-full"
            style={{ transform: `translateY(-${activePageIndex * bodyHeightPx}px)` }}
          >
            <EditorContent
              editor={editor}
              className={cn(
                "document-editor-surface h-full",
                "[&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none",
                "[&_.ProseMirror]:cursor-text",
              )}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="document-page-body-activator absolute inset-0 z-[1] cursor-text bg-transparent"
          aria-label={`Edit page ${pageIndex + 1}`}
          onClick={() => onActivate(pageIndex)}
        />
      )}
    </div>
  );
}

export function DocumentPage({
  businessProfile,
  documentTitle,
  documentMeta,
  className,
}: {
  businessProfile: DocumentBusinessProfile;
  documentTitle: string;
  documentMeta?: string;
  className?: string;
}) {
  const editor = useDocumentEditorContext();
  const bodyMeasureRef = useRef<HTMLDivElement>(null);
  const bodyHeightPx = useDocumentBodyHeight(bodyMeasureRef, Boolean(editor));
  const { pages, activePageIndex, setActivePageIndex } = usePaginatedDocumentPages(
    editor,
    bodyHeightPx,
  );

  function handleActivatePage(pageIndex: number) {
    setActivePageIndex(pageIndex);
    editor?.commands.focus();
  }

  return (
    <div className={cn("document-composer-print-root", className)}>
      <div
        aria-hidden="true"
        className="document-body-measure-host pointer-events-none absolute -left-[10000px] top-0 opacity-0"
      >
        <BlankPrintDocument
          businessName={businessProfile.businessName}
          businessLogoUrl={businessProfile.businessLogoUrl}
          businessVatRegistrationNo={businessProfile.businessVatRegistrationNo}
          businessContact={businessProfile.businessContact}
          businessEmail={businessProfile.businessEmail}
          businessAddress={businessProfile.businessAddress}
          documentTitle={documentTitle}
          documentMeta={documentMeta}
          layoutMode="document"
          bodyClassName="document-page-body pb-0"
          className="document-editable-page"
        >
          <div ref={bodyMeasureRef} className="document-page-body min-h-0 flex-1" />
        </BlankPrintDocument>
      </div>

      <DocumentPageStack
        pages={pages.map((pageHtml, pageIndex) => (
          <BlankPrintDocument
            key={`document-page-${pageIndex}`}
            businessName={businessProfile.businessName}
            businessLogoUrl={businessProfile.businessLogoUrl}
            businessVatRegistrationNo={businessProfile.businessVatRegistrationNo}
            businessContact={businessProfile.businessContact}
            businessEmail={businessProfile.businessEmail}
            businessAddress={businessProfile.businessAddress}
            documentTitle={documentTitle}
            documentMeta={formatPageMeta(documentMeta, pageIndex, pages.length)}
            layoutMode="document"
            bodyClassName="document-page-body pb-0"
            className="document-editable-page"
          >
            <DocumentPageBody
              pageHtml={pageHtml}
              pageIndex={pageIndex}
              activePageIndex={activePageIndex}
              bodyHeightPx={bodyHeightPx}
              onActivate={handleActivatePage}
            />
          </BlankPrintDocument>
        ))}
      />
    </div>
  );
}
