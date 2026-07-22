"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  PREVIEW_ZOOM_OPTIONS,
  PRINT_PAGE_HEIGHT_PX,
  PRINT_PAGE_WIDTH_PX,
  type PreviewZoomMode,
} from "@/components/reports/blank-document/constants";
import { paginateDocumentHtml } from "@/components/reports/blank-document/paginate-document-html";
import { BlankPrintDocument } from "@/components/reports/blank-print-document";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useDocumentPreviewScale(
  viewportRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const [scale, setScale] = useState(0.72);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    function updateScale() {
      const padding = 32;
      const availableWidth = Math.max(viewport!.clientWidth - padding, 0);
      const scaleByWidth = availableWidth / PRINT_PAGE_WIDTH_PX;
      const nextScale = Math.min(scaleByWidth, 1);

      setScale(Math.max(0.45, nextScale));
    }

    updateScale();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [enabled, viewportRef]);

  return scale;
}

function usePaginatedDocumentHtml(html: string) {
  const [pages, setPages] = useState<string[]>(() => paginateDocumentHtml(html));

  useLayoutEffect(() => {
    setPages(paginateDocumentHtml(html));
  }, [html]);

  return pages;
}

function PreviewZoomControls({
  value,
  onChange,
}: {
  value: PreviewZoomMode;
  onChange: (value: PreviewZoomMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {PREVIEW_ZOOM_OPTIONS.map((option) => (
        <Button
          key={option.label}
          type="button"
          size="sm"
          variant={value === option.value ? "secondary" : "ghost"}
          className="h-7 px-2.5 text-xs"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function DocumentPreview({
  documentTitle,
  documentMeta,
  bodyHtml,
  businessName,
  businessLogoUrl,
  businessVatRegistrationNo,
  businessContact,
  businessEmail,
  businessAddress,
  zoomMode,
  onZoomChange,
}: {
  documentTitle: string;
  documentMeta: string;
  bodyHtml: string;
  businessName: string;
  businessLogoUrl: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  zoomMode: PreviewZoomMode;
  onZoomChange: (value: PreviewZoomMode) => void;
}) {
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const fitScale = useDocumentPreviewScale(previewViewportRef, zoomMode === "fit");
  const effectiveScale = zoomMode === "fit" ? fitScale : zoomMode;
  const pages = usePaginatedDocumentHtml(bodyHtml);

  return (
    <section className="blank-document-preview-panel flex min-h-[280px] min-w-0 flex-1 flex-col lg:w-[65%]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Live preview
        </p>
        <PreviewZoomControls value={zoomMode} onChange={onZoomChange} />
      </div>

      <div
        ref={previewViewportRef}
        className="blank-document-preview-viewport flex min-h-0 flex-1 justify-center overflow-auto p-4"
      >
        <div
          className={cn("blank-document-preview-pages shrink-0", pages.length > 1 && "pb-2")}
          style={{
            width: PRINT_PAGE_WIDTH_PX * effectiveScale,
          }}
        >
          {pages.map((pageHtml, index) => (
            <div
              key={`${index}-${pageHtml.slice(0, 24)}`}
              className="blank-document-preview-page"
              style={{
                width: PRINT_PAGE_WIDTH_PX * effectiveScale,
                height: PRINT_PAGE_HEIGHT_PX * effectiveScale,
              }}
            >
              <div
                className="blank-document-preview-scale"
                style={{
                  width: PRINT_PAGE_WIDTH_PX,
                  height: PRINT_PAGE_HEIGHT_PX,
                  transform: `scale(${effectiveScale})`,
                }}
              >
                <PrintPageStack>
                  <BlankPrintDocument
                    businessName={businessName}
                    businessLogoUrl={businessLogoUrl}
                    businessVatRegistrationNo={businessVatRegistrationNo}
                    businessContact={businessContact}
                    businessEmail={businessEmail}
                    businessAddress={businessAddress}
                    documentTitle={documentTitle}
                    documentMeta={
                      index === 0 ? documentMeta : `${documentMeta} • Page ${index + 1} of ${pages.length}`
                    }
                    bodyClassName="pb-[12mm]"
                  >
                    <div
                      className="blank-document-body-content pt-6"
                      dangerouslySetInnerHTML={{ __html: pageHtml }}
                    />
                  </BlankPrintDocument>
                </PrintPageStack>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
