"use client";

import { useEffect, useRef, useState } from "react";

import {
  PRINT_PAGE_WIDTH_PX,
  type DocumentZoomMode,
} from "@/components/reports/document-composer/constants";
import { cn } from "@/lib/utils";

function useDocumentViewportScale(
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

export function DocumentViewport({
  zoomMode,
  children,
  className,
}: {
  zoomMode: DocumentZoomMode;
  children: React.ReactNode;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const fitScale = useDocumentViewportScale(viewportRef, zoomMode === "fit");
  const effectiveScale = zoomMode === "fit" ? fitScale : zoomMode;

  return (
    <section className={cn("document-viewport-panel flex min-h-0 flex-1 flex-col", className)}>
      <div
        ref={viewportRef}
        className="document-viewport flex min-h-0 flex-1 justify-center overflow-auto px-3 py-4 sm:px-4 sm:py-5"
      >
        <div
          className="document-viewport-scale shrink-0"
          style={{
            width: PRINT_PAGE_WIDTH_PX * effectiveScale,
          }}
        >
          <div
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
    </section>
  );
}
