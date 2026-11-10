"use client";

import { useLayoutEffect, useRef, useState } from "react";

import {
  DOCUMENT_ZOOM_OPTIONS,
  PRINT_PAGE_HEIGHT_PX,
  PRINT_PAGE_WIDTH_PX,
  type DocumentZoomMode,
} from "@/components/document-engine/constants";
import { useDocumentViewportScale } from "@/components/document-engine/hooks/use-document-viewport-scale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function DocumentZoom({
  value,
  onChange,
  className,
}: {
  value: DocumentZoomMode;
  onChange: (value: DocumentZoomMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "document-composer-chrome no-print flex flex-wrap items-center gap-1",
        className,
      )}
      role="group"
      aria-label="Zoom"
    >
      {DOCUMENT_ZOOM_OPTIONS.map((option) => (
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

export function DocumentViewport({
  zoomMode,
  onZoomChange,
  children,
  className,
}: {
  zoomMode: DocumentZoomMode;
  onZoomChange: (value: DocumentZoomMode) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageStackRef = useRef<HTMLDivElement>(null);
  const [stackHeightPx, setStackHeightPx] = useState(PRINT_PAGE_HEIGHT_PX);
  const fitScale = useDocumentViewportScale(viewportRef, zoomMode === "fit");
  const effectiveScale = zoomMode === "fit" ? fitScale : zoomMode;

  useLayoutEffect(() => {
    const pageStack = pageStackRef.current;

    if (!pageStack) {
      return;
    }

    function updateHeight() {
      const nextHeight = Math.ceil(pageStack!.offsetHeight);

      if (nextHeight > 0) {
        setStackHeightPx((current) => (current === nextHeight ? current : nextHeight));
      }
    }

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(pageStack);

    return () => observer.disconnect();
  }, [children]);

  const scaledWidth = PRINT_PAGE_WIDTH_PX * effectiveScale;
  const scaledHeight = stackHeightPx * effectiveScale;

  return (
    <section className={cn("document-viewport-panel flex min-h-0 flex-1 flex-col", className)}>
      <div className="document-composer-chrome no-print flex shrink-0 flex-wrap items-center justify-end gap-2 border-b border-border/50 px-4 py-2">
        <DocumentZoom value={zoomMode} onChange={onZoomChange} />
      </div>

      <div
        ref={viewportRef}
        className="document-viewport flex min-h-0 flex-1 justify-center overflow-auto px-3 py-4 sm:px-4 sm:py-5"
      >
        <div
          className="document-viewport-scale shrink-0"
          style={{
            width: scaledWidth,
            height: scaledHeight,
          }}
        >
          <div
            className="document-viewport-pages"
            style={{
              width: scaledWidth,
              height: scaledHeight,
            }}
          >
            <div
              ref={pageStackRef}
              className="document-viewport-page"
              style={{
                width: PRINT_PAGE_WIDTH_PX,
                transform: `scale(${effectiveScale})`,
                transformOrigin: "top left",
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export type { DocumentZoomMode };
